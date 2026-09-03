import { useEffect, useMemo, useRef } from 'react';
import { AppState } from 'react-native';
import {
  endPrayerActivity,
  prayerWidgetAvailable,
  setPrayerSnapshot,
  startOrUpdatePrayerActivity,
} from '../../modules/prayer-widget';
import { useHijriMonth, useMosque, usePrayerTimes } from '@/api/queries';
import type { PrayerDay } from '@/api/types';
import { useEffectiveAsrMethod } from '@/hooks/useEffectiveAsrMethod';
import { formatHijri } from '@/lib/hijri';
import { resolveActivityWindow } from '@/lib/liveActivityWindow';
import { isJummahCell, type SnapshotDayInput } from '@/lib/widgetSnapshot';
import { adhanTimesFromSchedule, buildDaySchedule, jamatTimesForDate } from '@/lib/prayerSchedule';
import { isoDateKey, osloDayKey, parseDayKey, todayKey } from '@/lib/time';
import { buildSnapshot, snapshotIsEmpty } from '@/lib/widgetSnapshot';
import { usePrayerLog } from '@/store/prayerLog';
import { useActiveLocation, useSettings } from '@/store/settings';

const SNAPSHOT_DAYS = 3;

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function findDay(rows: PrayerDay[] | undefined, date: Date): PrayerDay | undefined {
  const key = todayKey(date);
  return rows?.find((row) => row.date === key);
}

/**
 * Keeps the home screen widgets and the Live Activity in step with what the app knows.
 * Reuses the existing react-query keys, so this adds no network requests of its own.
 */
export function useWidgetSync(now: Date) {
  const location = useActiveLocation();
  const asrMethod = useEffectiveAsrMethod();
  const mosque = useSettings((state) => state.mosque);
  const showJamat = useSettings((state) => state.widgetShowJamat);
  const lockScreenEnabled = useSettings((state) => state.liveActivityEnabled);
  const mosqueDetails = useMosque(mosque?.orgNr ?? '', { enabled: mosque != null });

  const dayKey = osloDayKey(now);
  const dayStart = useMemo(() => parseDayKey(dayKey), [dayKey]);
  const lastDay = useMemo(() => addDays(dayStart, SNAPSHOT_DAYS - 1), [dayStart]);

  const currentMonth = usePrayerTimes(location.iso, dayStart.getFullYear(), dayStart.getMonth() + 1);
  const nextMonth = usePrayerTimes(location.iso, lastDay.getFullYear(), lastDay.getMonth() + 1);
  const currentHijri = useHijriMonth(dayStart.getFullYear(), dayStart.getMonth() + 1);
  const nextHijri = useHijriMonth(lastDay.getFullYear(), lastDay.getMonth() + 1);

  const mosqueIso = mosqueDetails.data?.location_iso;
  const mosqueInLocation = mosqueIso == null || mosqueIso === location.iso;

  const days = useMemo<SnapshotDayInput[]>(() => {
    const rows = [...(currentMonth.data ?? []), ...(nextMonth.data ?? [])];
    const hijriRows = [...(currentHijri.data ?? []), ...(nextHijri.data ?? [])];

    const built = Array.from({ length: SNAPSHOT_DAYS }, (_, index): SnapshotDayInput | null => {
      const date = addDays(dayStart, index);
      const row = findDay(rows, date);
      if (!row) return null;

      const schedule = buildDaySchedule(row, date, asrMethod);
      const iso = isoDateKey(date);
      const hijriRow = hijriRows.find((entry) => entry.gregorian_date === iso);
      const jamatTimes = mosqueInLocation
        ? jamatTimesForDate(
            mosqueDetails.data?.jamat,
            iso,
            adhanTimesFromSchedule(schedule),
            mosqueDetails.data?.jummah ?? [],
          )
        : {};

      return {
        date,
        schedule,
        hijriText: hijriRow ? formatHijri(hijriRow.hijri_date, hijriRow.hijri_month_text) : '',
        jamatTimes,
        hasJummah: mosqueInLocation && (mosqueDetails.data?.jummah?.length ?? 0) > 0,
      };
    });

    return built.filter((day): day is SnapshotDayInput => day !== null);
  }, [
    currentMonth.data,
    nextMonth.data,
    currentHijri.data,
    nextHijri.data,
    dayStart,
    asrMethod,
    mosqueInLocation,
    mosqueDetails.data?.jamat,
    mosqueDetails.data?.jummah,
  ]);

  const snapshot = useMemo(
    () =>
      buildSnapshot({
        locationName: location.name,
        mosqueName: mosqueInLocation ? (mosque?.name ?? null) : null,
        showJamat,
        lockScreenEnabled,
        generatedAt: now,
        days,
      }),
    [location.name, mosque, mosqueInLocation, showJamat, lockScreenEnabled, days, now],
  );

  // `now` ticks every second in the app; the payload only matters when the times change.
  const payloadKey = useMemo(() => {
    const { generatedAt: _ignored, ...rest } = snapshot;
    return JSON.stringify(rest);
  }, [snapshot]);

  const lastWritten = useRef<string | null>(null);

  useEffect(() => {
    if (!prayerWidgetAvailable) return;
    if (snapshotIsEmpty(snapshot)) return;
    if (lastWritten.current === payloadKey) return;
    lastWritten.current = payloadKey;
    setPrayerSnapshot(snapshot);
  }, [payloadKey, snapshot]);

  const syncActivity = useLiveActivitySync(location.name, days, now);

  useEffect(() => {
    syncActivity();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncActivity();
    });
    return () => subscription.remove();
  }, [syncActivity]);
}

/**
 * The activity mirrors whichever prayer is unmarked right now. It is refreshed on every minute
 * tick and whenever the app comes to the foreground, because iOS only lets an app start one
 * while it is running; ActivityKit keeps the countdown ticking on its own in between.
 */
function useLiveActivitySync(locationName: string, days: SnapshotDayInput[], now: Date) {
  const enabled = useSettings((state) => state.liveActivityEnabled);
  const log = usePrayerLog((state) => state.log);
  const applied = useRef<string | null>(null);

  const activityDays = useMemo(
    () => days.map((day) => ({ isoDate: isoDateKey(day.date), schedule: day.schedule })),
    [days],
  );

  const window = useMemo(
    () => (enabled ? resolveActivityWindow(activityDays, log, now) : null),
    [enabled, activityDays, log, now],
  );

  return useMemo(() => {
    return () => {
      if (!prayerWidgetAvailable) return;

      const apply = (key: string, run: () => void) => {
        if (applied.current === key) return;
        applied.current = key;
        run();
      };

      // Before the times have loaded there is nothing to say, and ending a running activity
      // over an empty schedule would make it flicker on every cold start.
      if (days.length === 0) return;

      if (!window) {
        apply('', () => void endPrayerActivity());
        return;
      }

      const day = days.find((entry) => isoDateKey(entry.date) === window.isoDate);
      const label = day && isJummahCell(day, window.prayer.name) ? 'Jummah' : window.prayer.label;

      const state = {
        locationName,
        isoDate: window.isoDate,
        prayerLabel: label,
        prayerKind: window.prayer.name,
        prayerAt: window.prayer.date.getTime() / 1000,
        windowEnd: window.windowEnd.getTime() / 1000,
      };

      apply(JSON.stringify(state), () => void startOrUpdatePrayerActivity(state));
    };
  }, [window, locationName, days]);
}
