import { useMemo } from 'react';
import type { PrayerDay } from '@/api/types';
import { buildDaySchedule, findNextPrayer, type NextPrayerResult, type PrayerEntry } from '@/lib/prayerSchedule';
import { parseDayKey, todayKey } from '@/lib/time';
import { useActiveDayKeys } from '@/hooks/useActiveDay';
import { useEffectiveAsrMethod } from '@/hooks/useEffectiveAsrMethod';
import { usePrayerMonth, zoneFor } from '@/hooks/usePrayerMonth';
import { useActiveLocation } from '@/store/settings';

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function findDay(days: PrayerDay[] | undefined, date: Date): PrayerDay | undefined {
  const key = todayKey(date);
  return days?.find((day) => day.date === key);
}

export type PrayerDayData = {
  today: PrayerDay | undefined;
  todaySchedule: PrayerEntry[];
  tomorrowSchedule: PrayerEntry[];
  nextPrayer: NextPrayerResult | null;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
};

export function usePrayerDay(now: Date): PrayerDayData {
  const location = useActiveLocation();
  const asrMethod = useEffectiveAsrMethod();
  const zone = zoneFor(location);

  const { dayKey } = useActiveDayKeys(now);
  const dayStart = useMemo(() => parseDayKey(dayKey), [dayKey]);
  const tomorrowStart = useMemo(() => addDays(dayStart, 1), [dayStart]);

  const currentMonth = usePrayerMonth(location, dayStart.getFullYear(), dayStart.getMonth() + 1);
  const needsNextMonth = tomorrowStart.getMonth() !== dayStart.getMonth();
  const nextMonth = usePrayerMonth(
    location,
    tomorrowStart.getFullYear(),
    tomorrowStart.getMonth() + 1,
  );

  const todayRow = findDay(currentMonth.data, dayStart);
  const tomorrowRow = needsNextMonth
    ? findDay(nextMonth.data, tomorrowStart)
    : findDay(currentMonth.data, tomorrowStart);

  const dayAfter = addDays(dayStart, 2);
  const dayAfterRow = findDay(nextMonth.data, dayAfter) ?? findDay(currentMonth.data, dayAfter);

  const todaySchedule = useMemo(
    () => (todayRow ? buildDaySchedule(todayRow, dayStart, asrMethod, zone, tomorrowRow) : []),
    [todayRow, tomorrowRow, dayStart, asrMethod, zone],
  );

  const tomorrowSchedule = useMemo(
    () =>
      tomorrowRow
        ? buildDaySchedule(tomorrowRow, tomorrowStart, asrMethod, zone, dayAfterRow)
        : [],
    [tomorrowRow, dayAfterRow, tomorrowStart, asrMethod, zone],
  );

  const nextPrayer = useMemo(
    () => findNextPrayer(todaySchedule, tomorrowSchedule, now),
    [todaySchedule, tomorrowSchedule, now],
  );

  return {
    today: todayRow,
    todaySchedule,
    tomorrowSchedule,
    nextPrayer,
    isLoading: currentMonth.isLoading,
    isError: currentMonth.isError,
    refetch: currentMonth.refetch,
  };
}
