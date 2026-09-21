import { zonedDateKey, zonedDayKey, type PrayerTimeZone } from '@/lib/time';
import { zoneFor } from '@/hooks/usePrayerMonth';
import { useActiveLocation } from '@/store/settings';

export type ActiveDayKeys = {
  dayKey: string;
  isoDate: string;
};

export function activeDayKeys(now: Date, zone: PrayerTimeZone): ActiveDayKeys {
  return { dayKey: zonedDayKey(now, zone), isoDate: zonedDateKey(now, zone) };
}

export function useActiveDayKeys(now: Date): ActiveDayKeys {
  const location = useActiveLocation();
  return activeDayKeys(now, zoneFor(location));
}
