import { isoDateKey, osloDateKey, osloDayKey, todayKey } from '@/lib/time';
import { useActiveLocation } from '@/store/settings';

export type ActiveDayKeys = {
  dayKey: string;
  isoDate: string;
};

export function activeDayKeys(now: Date, calculated: boolean): ActiveDayKeys {
  return calculated
    ? { dayKey: todayKey(now), isoDate: isoDateKey(now) }
    : { dayKey: osloDayKey(now), isoDate: osloDateKey(now) };
}

export function useActiveDayKeys(now: Date): ActiveDayKeys {
  const location = useActiveLocation();
  return activeDayKeys(now, location.mode === 'calculated');
}
