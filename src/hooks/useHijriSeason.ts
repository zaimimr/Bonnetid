import { useMemo } from 'react';
import { useHijriMonth } from '@/api/queries';
import type { HijriDay } from '@/api/types';
import { useNow } from '@/hooks/useNow';
import { activeSeasonStatus, type SeasonStatus } from '@/lib/hijriSeason';
import { currentNight, type UpcomingNight } from '@/lib/hijriNights';
import { osloDateKey, osloDayStart } from '@/lib/time';

const SEASON_TICK_MS = 30_000;

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

export function useSeasonStatus(now: Date): SeasonStatus | null {
  const rows = useHijriLookahead(now);
  const todayIso = osloDateKey(now);
  return useMemo(() => activeSeasonStatus(rows, todayIso), [rows, todayIso]);
}

export function useHijriSeasonNow(): { now: Date; status: SeasonStatus | null } {
  const now = useNow(SEASON_TICK_MS);
  const status = useSeasonStatus(now);
  return { now, status };
}

export function useCurrentNight(now: Date): UpcomingNight | null {
  const rows = useHijriLookahead(now);
  const todayIso = osloDateKey(now);
  return useMemo(() => currentNight(rows, todayIso), [rows, todayIso]);
}
