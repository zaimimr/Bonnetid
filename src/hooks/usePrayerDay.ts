import { useMemo } from 'react';
import { usePrayerTimes } from '@/api/queries';
import type { PrayerDay } from '@/api/types';
import { buildDaySchedule, findNextPrayer, type NextPrayerResult, type PrayerEntry } from '@/lib/prayerSchedule';
import { osloDayKey, parseDayKey, todayKey } from '@/lib/time';
import { useEffectiveAsrMethod } from '@/hooks/useEffectiveAsrMethod';
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

  const dayKey = osloDayKey(now);
  const dayStart = useMemo(() => parseDayKey(dayKey), [dayKey]);
  const tomorrowStart = useMemo(() => addDays(dayStart, 1), [dayStart]);

  const currentMonth = usePrayerTimes(location.iso, dayStart.getFullYear(), dayStart.getMonth() + 1);
  const needsNextMonth = tomorrowStart.getMonth() !== dayStart.getMonth();
  const nextMonth = usePrayerTimes(
    location.iso,
    tomorrowStart.getFullYear(),
    tomorrowStart.getMonth() + 1,
  );

  const todayRow = findDay(currentMonth.data, dayStart);
  const tomorrowRow = needsNextMonth
    ? findDay(nextMonth.data, tomorrowStart)
    : findDay(currentMonth.data, tomorrowStart);

  const todaySchedule = useMemo(
    () => (todayRow ? buildDaySchedule(todayRow, dayStart, asrMethod) : []),
    [todayRow, dayStart, asrMethod],
  );

  const tomorrowSchedule = useMemo(
    () => (tomorrowRow ? buildDaySchedule(tomorrowRow, tomorrowStart, asrMethod) : []),
    [tomorrowRow, tomorrowStart, asrMethod],
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
