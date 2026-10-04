import { useMemo } from 'react';
import { useHijriLookahead } from '@/hooks/useHijriSeason';
import { useNow } from '@/hooks/useNow';
import { usePrayerMonth, zoneFor } from '@/hooks/usePrayerMonth';
import { eidModeAt, type EidMode } from '@/lib/eidMode';
import { osloDateKey, osloDayStart, todayKey, wallClockToDate } from '@/lib/time';
import { useActiveLocation } from '@/store/settings';

const EID_TICK_MS = 60_000;

export function useEidMode(): EidMode | null {
  const now = useNow(EID_TICK_MS);
  const location = useActiveLocation();
  const zone = zoneFor(location);
  const rows = useHijriLookahead(now);
  const todayIso = osloDateKey(now);
  const today = osloDayStart(now);
  const month = usePrayerMonth(location, today.getFullYear(), today.getMonth() + 1);
  const maghribTime = month.data?.find((day) => day.date === todayKey(today))?.maghrib ?? null;

  return useMemo(() => {
    const maghrib = maghribTime ? wallClockToDate(todayIso, maghribTime, zone) : null;
    return eidModeAt(rows, todayIso, now, maghrib);
  }, [rows, todayIso, now, maghribTime, zone]);
}
