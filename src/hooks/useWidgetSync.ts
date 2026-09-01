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
import {
  adhanTimesFromSchedule,
  buildDaySchedule,
  findNextPrayer,
  jamatTimesForDate,
  type PrayerEntry,
} from '@/lib/prayerSchedule';
import { isoDateKey, parseDayKey, todayKey } from '@/lib/time';
import { buildSnapshot, snapshotIsEmpty, type SnapshotDayInput } from '@/lib/widgetSnapshot';
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
  const mosqueDetails = useMosque(mosque?.orgNr ?? '', { enabled: mosque != null });

  const dayKey = todayKey(now);
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
        generatedAt: now,
        days,
      }),
    [location.name, mosque?.name, mosqueInLocation, days, now],
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

  const schedules = useMemo(() => {
    const today = days[0]?.schedule ?? [];
    const tomorrow = days[1]?.schedule ?? [];
    return { today, tomorrow };
  }, [days]);

  const syncActivity = useLiveActivitySync(location.name, schedules);

  useEffect(() => {
    syncActivity();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncActivity();
    });
    return () => subscription.remove();
  }, [syncActivity]);
}

/**
 * The activity is refreshed whenever the app comes to the foreground: iOS only lets an app start
 * one while it is running, and ActivityKit keeps the countdown ticking on its own in between.
 */
function useLiveActivitySync(
  locationName: string,
  schedules: { today: PrayerEntry[]; tomorrow: PrayerEntry[] },
) {
  const enabled = useSettings((state) => state.liveActivityEnabled);
  const lastState = useRef<string | null>(null);

  return useMemo(() => {
    return () => {
      if (!prayerWidgetAvailable) return;

      if (!enabled) {
        lastState.current = null;
        void endPrayerActivity();
        return;
      }

      const at = new Date();
      const result = findNextPrayer(schedules.today, schedules.tomorrow, at);
      if (!result) {
        lastState.current = null;
        void endPrayerActivity();
        return;
      }

      const headline = result.current ?? result.next;
      const windowStart = result.current?.date ?? at;
      const state = {
        locationName,
        prayerLabel: headline.label,
        prayerKind: headline.name,
        prayerAt: headline.date.getTime() / 1000,
        windowStart: windowStart.getTime() / 1000,
        windowEnd: result.next.date.getTime() / 1000,
        isNow: result.current != null,
        nextLabel: result.next.label,
      };

      const key = JSON.stringify(state);
      if (lastState.current === key) return;
      lastState.current = key;
      void startOrUpdatePrayerActivity(state);
    };
  }, [enabled, locationName, schedules.today, schedules.tomorrow]);
}
