import { deviceOffsetMinutes, formatUtcOffset, isNamedTimeZone, osloOffsetMinutes } from '@/lib/time';
import { zoneOffsetMinutes } from '@/lib/timezone';
import { zoneFor } from '@/hooks/usePrayerMonth';
import { useActiveLocation, type SavedLocation } from '@/store/settings';
import { t } from '@/lib/i18n';

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
    const localOffset = formatUtcOffset(local);
    const deviceOffset = formatUtcOffset(device);
    return t('travel.timesAreShownIn', { name: location.name, localOffset, deviceOffset });
  }

  if (device === osloOffsetMinutes(now)) return null;
  const deviceOffset = formatUtcOffset(device);
  return t('travel.timesAreForIn', { name: location.name, deviceOffset });
}
