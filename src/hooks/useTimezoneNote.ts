import { deviceOffsetMinutes, formatUtcOffset, isNamedTimeZone, osloOffsetMinutes } from '@/lib/time';
import { zoneOffsetMinutes } from '@/lib/timezone';
import { zoneFor } from '@/hooks/usePrayerMonth';
import { useActiveLocation, type SavedLocation } from '@/store/settings';

export function useTimezoneNote(
  now: Date = new Date(),
  override?: SavedLocation | null,
): string | null {
  const active = useActiveLocation();
  const location = override ?? active;
  const device = deviceOffsetMinutes(now);

  if (location.mode === 'calculated') {
    const zone = zoneFor(location);
    if (!isNamedTimeZone(zone)) return null;
    const local = zoneOffsetMinutes(zone, now);
    if (local == null || local === device) return null;
    return `Tidene vises i lokal tid for ${location.name} (${formatUtcOffset(local)}). Telefonen din står på ${formatUtcOffset(device)}`;
  }

  if (device === osloOffsetMinutes(now)) return null;
  return `Tidene gjelder ${location.name} i norsk tid, vist i din lokale tid (${formatUtcOffset(device)})`;
}
