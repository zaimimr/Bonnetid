import { useEffect, useMemo, useRef } from 'react';
import { AppState } from 'react-native';
import {
  endPrayerActivity,
  prayerWidgetAvailable,
  setPrayerSnapshot,
  startOrUpdatePrayerActivity,
} from '../../modules/prayer-widget';
import { useHijriMonth, useMosque, useMosques } from '@/api/queries';
import type { PrayerDay } from '@/api/types';
import { useActiveDayKeys } from '@/hooks/useActiveDay';
import { useEffectiveAsrMethod } from '@/hooks/useEffectiveAsrMethod';
import { usePrayerMonth, zoneFor } from '@/hooks/usePrayerMonth';
import { formatHijri } from '@/lib/hijri';
import { resolveActivityWindow } from '@/lib/liveActivityWindow';
import { jummahSlotFor } from '@/lib/jummah';
import { isJummahCell, type SnapshotDayInput, type SnapshotMosqueInput } from '@/lib/widgetSnapshot';
import {
  adhanTimesFromSchedule,
  buildDaySchedule,
  jamatTimesForDate,
  nextPrayerDay,
  type PrayerEntry,
} from '@/lib/prayerSchedule';
import { isoDateKey, parseDayKey, todayKey } from '@/lib/time';
import { buildSnapshot, snapshotIsEmpty } from '@/lib/widgetSnapshot';
import { usePrayerLog } from '@/store/prayerLog';
import { useActiveLocation, useActiveMosque, useSettings } from '@/store/settings';

const SNAPSHOT_DAYS = 30;

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
  const zone = zoneFor(location);
  const mosque = useActiveMosque();
  const showJamat = useSettings((state) => state.widgetShowJamat) && mosque != null;
  const liveActivityEnabled = useSettings((state) => state.liveActivityEnabled);
  const trackerEnabled = useSettings((state) => state.prayerTrackerEnabled);
  const lockScreenEnabled = liveActivityEnabled && trackerEnabled;
  const mosqueDetails = useMosque(mosque?.orgNr ?? '', { enabled: mosque != null });
  const mosqueList = useMosques();

  const { dayKey } = useActiveDayKeys(now);
  const dayStart = useMemo(() => parseDayKey(dayKey), [dayKey]);
  const lastDay = useMemo(() => addDays(dayStart, SNAPSHOT_DAYS - 1), [dayStart]);
  const yesterday = useMemo(() => addDays(dayStart, -1), [dayStart]);

  const previousMonth = usePrayerMonth(location, yesterday.getFullYear(), yesterday.getMonth() + 1);
  const previousHijri = useHijriMonth(yesterday.getFullYear(), yesterday.getMonth() + 1);
  const currentMonth = usePrayerMonth(location, dayStart.getFullYear(), dayStart.getMonth() + 1);
  const nextMonth = usePrayerMonth(location, lastDay.getFullYear(), lastDay.getMonth() + 1);
  const currentHijri = useHijriMonth(dayStart.getFullYear(), dayStart.getMonth() + 1);
  const nextHijri = useHijriMonth(lastDay.getFullYear(), lastDay.getMonth() + 1);

  const mosqueIso = mosqueDetails.data?.location_iso;
  const mosqueInLocation = mosqueIso == null || mosqueIso === location.iso;

  const days = useMemo<SnapshotDayInput[]>(() => {
    const rows = [
      ...(previousMonth.data ?? []),
      ...(currentMonth.data ?? []),
      ...(nextMonth.data ?? []),
    ];
    const hijriRows = [
      ...(previousHijri.data ?? []),
      ...(currentHijri.data ?? []),
      ...(nextHijri.data ?? []),
    ];

    // Yesterday rides along because its Isha is still running until Fajr.
    const built = Array.from({ length: SNAPSHOT_DAYS + 1 }, (_, index): SnapshotDayInput | null => {
      const date = addDays(yesterday, index);
      const row = findDay(rows, date);
      if (!row) return null;

      const schedule = buildDaySchedule(row, date, asrMethod, zone, nextPrayerDay(rows, row));
      const iso = isoDateKey(date);
      const hijriRow = hijriRows.find((entry) => entry.gregorian_date === iso);
      // The Jumuah rides along separately, so a widget can drop back to Dhuhr on its own
      // once the last congregation is over, without the app having to write a new snapshot.
      const jamatTimes = jamatTimesForDate(
        mosqueInLocation ? mosqueDetails.data?.jamat : null,
        iso,
        mosqueInLocation ? adhanTimesFromSchedule(schedule) : {},
      );

      return {
        date,
        schedule,
        hijriText: hijriRow ? formatHijri(hijriRow.hijri_date, hijriRow.hijri_month_text) : '',
        jamatTimes,
        jummah: jummahSlotFor(iso, mosqueDetails.data?.jummah ?? []),
      };
    });

    return built.filter((day): day is SnapshotDayInput => day !== null);
  }, [
    previousMonth.data,
    currentMonth.data,
    nextMonth.data,
    previousHijri.data,
    currentHijri.data,
    nextHijri.data,
    yesterday,
    asrMethod,
    zone,
    mosqueInLocation,
    mosqueDetails.data?.jamat,
    mosqueDetails.data?.jummah,
  ]);

  // The car app ranks these against its own position, so every mosque with coordinates ships.
  const mosques = useMemo<SnapshotMosqueInput[]>(() => {
    if (location.mode === 'calculated') return [];
    return (mosqueList.data ?? [])
      .filter((entry) => entry.lat != null && entry.lon != null)
      .map((entry) => ({
        orgNr: entry.org_nr,
        name: entry.name,
        address: entry.address,
        lat: Number(entry.lat),
        lon: Number(entry.lon),
      }));
  }, [mosqueList.data, location.mode]);

  const snapshot = useMemo(
    () =>
      buildSnapshot({
        locationName: location.name,
        mode: location.mode,
        origin: { lat: location.lat, lon: location.lon },
        mosques,
        mosqueName: mosque?.name ?? null,
        showJamat,
        lockScreenEnabled,
        generatedAt: now,
        days,
      }),
    [
      location.name,
      location.mode,
      location.lat,
      location.lon,
      mosques,
      mosque,
      showJamat,
      lockScreenEnabled,
      days,
      now,
    ],
  );

  // `now` ticks every second in the app; the payload only matters when the times change.
  const payloadKey = useMemo(() => {
    const { generatedAt: _ignored, mosques: written, ...rest } = snapshot;
    return JSON.stringify({ ...rest, mosques: written.length });
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
  const trackerEnabled = useSettings((state) => state.prayerTrackerEnabled);
  const log = usePrayerLog((state) => state.log);
  const applied = useRef<string | null>(null);

  const activityDays = useMemo(
    () => days.map((day) => ({ isoDate: isoDateKey(day.date), schedule: day.schedule })),
    [days],
  );

  const window = useMemo(() => {
    if (!enabled) return null;
    const resolved = resolveActivityWindow(activityDays, log, now);
    if (!resolved || resolved.windowOver) return null;
    return resolved;
  }, [enabled, activityDays, log, now]);

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

      const labelFor = (isoDate: string, prayer: PrayerEntry) => {
        const day = days.find((entry) => isoDateKey(entry.date) === isoDate);
        return day && isJummahCell(day, prayer.name, now) ? 'Jumuah' : prayer.label;
      };

      const { next } = window;

      const state = {
        locationName,
        isoDate: window.isoDate,
        prayerLabel: labelFor(window.isoDate, window.prayer),
        prayerKind: window.prayer.name,
        prayerAt: window.prayer.date.getTime() / 1000,
        windowEnd: window.windowEnd.getTime() / 1000,
        showMarkButtons: trackerEnabled,
        nextIsoDate: next?.isoDate ?? '',
        nextLabel: next ? labelFor(next.isoDate, next.prayer) : '',
        nextKind: next?.prayer.name ?? '',
        nextAt: next ? next.prayer.date.getTime() / 1000 : 0,
        nextWindowEnd: next ? next.windowEnd.getTime() / 1000 : 0,
      };

      apply(JSON.stringify(state), () => void startOrUpdatePrayerActivity(state));
    };
  }, [window, locationName, days, trackerEnabled, now]);
}
