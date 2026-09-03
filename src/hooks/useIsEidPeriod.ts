import { useHijriMonth } from '@/api/queries';
import { isEidPrayerPeriod, parseHijriDate } from '@/lib/hijri';
import { osloDateKey } from '@/lib/time';

export function useIsEidPeriod(): boolean {
  const today = new Date();
  const { data } = useHijriMonth(today.getFullYear(), today.getMonth() + 1);
  const row = data?.find((day) => day.gregorian_date === osloDateKey(today));
  if (!row) return false;
  const parsed = parseHijriDate(row.hijri_date);
  return parsed != null && isEidPrayerPeriod(parsed);
}
