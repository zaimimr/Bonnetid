import { useMemo } from 'react';
import { useHijriMonth } from '@/api/queries';
import type { HijriDay } from '@/api/types';
import { ramadanStatusFrom, type RamadanStatus } from '@/lib/ramadan';
import { osloDateKey, osloDayStart } from '@/lib/time';

export function useHijriLookahead(now: Date): HijriDay[] {
  const today = osloDayStart(now);
  const thisMonth = useHijriMonth(today.getFullYear(), today.getMonth() + 1);
  const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const nextMonth = useHijriMonth(nextMonthStart.getFullYear(), nextMonthStart.getMonth() + 1);

  return useMemo(
    () => [...(thisMonth.data ?? []), ...(nextMonth.data ?? [])],
    [thisMonth.data, nextMonth.data],
  );
}

export function useRamadanStatus(now: Date): RamadanStatus {
  const rows = useHijriLookahead(now);
  const todayIso = osloDateKey(now);
  return useMemo(() => ramadanStatusFrom(rows, todayIso), [rows, todayIso]);
}
