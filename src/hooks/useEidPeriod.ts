import { useHijriMonth } from '@/api/queries';
import { eidPeriodOf, parseHijriDate, type EidPeriod } from '@/lib/hijri';
import { osloDateKey, osloDayStart } from '@/lib/time';

export function useEidPeriod(): EidPeriod | null {
  const now = new Date();
  const today = osloDayStart(now);
  const { data } = useHijriMonth(today.getFullYear(), today.getMonth() + 1);
  const row = data?.find((day) => day.gregorian_date === osloDateKey(now));
  if (!row) return null;
  const parsed = parseHijriDate(row.hijri_date);
  return parsed == null ? null : eidPeriodOf(parsed);
}
