import { deviceOffsetMinutes, formatUtcOffset, osloOffsetMinutes } from '@/lib/time';
import { useActiveLocation } from '@/store/settings';

export function useTimezoneNote(now: Date = new Date()): string | null {
  const location = useActiveLocation();
  const device = deviceOffsetMinutes(now);
  if (location.mode === 'calculated') return null;
  if (device === osloOffsetMinutes(now)) return null;
  return `Tidene gjelder ${location.name} i norsk tid, vist i din lokale tid (${formatUtcOffset(device)})`;
}
