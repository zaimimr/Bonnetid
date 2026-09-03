import { useMemo } from 'react';
import { usePrayerTimes } from '@/api/queries';
import { unmarkedPrayers, type LoggedPrayer } from '@/lib/prayerLog';
import { buildDaySchedule, type PrayerEntry } from '@/lib/prayerSchedule';
import { isoDateKey, osloDateKey, osloDayStart, parseDayKey, todayKey } from '@/lib/time';
import { useEffectiveAsrMethod } from '@/hooks/useEffectiveAsrMethod';
import { usePrayerLog } from '@/store/prayerLog';
import { useActiveLocation } from '@/store/settings';

const MINUTE_MS = 60 * 1000;

export function usePrayerTodo(now: Date, todaySchedule: PrayerEntry[]): LoggedPrayer[] {
  const location = useActiveLocation();
  const asrMethod = useEffectiveAsrMethod();
  const log = usePrayerLog((state) => state.log);

  const minute = Math.floor(now.getTime() / MINUTE_MS);
  const at = useMemo(() => new Date(minute * MINUTE_MS), [minute]);

  const todayIso = osloDateKey(at);
  const yesterday = osloDayStart(at);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = todayKey(yesterday);
  const yesterdayIso = isoDateKey(yesterday);

  const yesterdayMonth = usePrayerTimes(
    location.iso,
    yesterday.getFullYear(),
    yesterday.getMonth() + 1,
  );
  const yesterdayRow = yesterdayMonth.data?.find((row) => row.date === yesterdayKey);

  const yesterdayIsha = useMemo(() => {
    if (!yesterdayRow) return null;
    const schedule = buildDaySchedule(yesterdayRow, parseDayKey(yesterdayKey), asrMethod);
    return schedule.find((entry) => entry.name === 'isha') ?? null;
  }, [yesterdayRow, yesterdayKey, asrMethod]);

  const days = useMemo(() => {
    const fajr = todaySchedule.find((entry) => entry.name === 'fajr');
    const beforeFajr = fajr != null && at.getTime() < fajr.date.getTime();
    const result: { isoDate: string; schedule: PrayerEntry[] }[] = [];
    if (yesterdayIsha && beforeFajr) result.push({ isoDate: yesterdayIso, schedule: [yesterdayIsha] });
    result.push({ isoDate: todayIso, schedule: todaySchedule });
    return result;
  }, [todaySchedule, yesterdayIsha, yesterdayIso, todayIso, at]);

  return useMemo(() => unmarkedPrayers(days, log, at), [days, log, at]);
}
