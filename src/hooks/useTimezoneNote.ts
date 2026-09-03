import { deviceOffsetMinutes, formatUtcOffset, osloOffsetMinutes } from '@/lib/time';

export function useTimezoneNote(now: Date = new Date()): string | null {
  const device = deviceOffsetMinutes(now);
  if (device === osloOffsetMinutes(now)) return null;
  return `Tidene gjelder Oslo, vist i din lokale tid (${formatUtcOffset(device)})`;
}
