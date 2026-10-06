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
    return t({
      nb: `Tidene vises i lokal tid for ${location.name} (${localOffset}). Telefonen din står på ${deviceOffset}`,
      en: `Times are shown in local time for ${location.name} (${localOffset}). Your phone is set to ${deviceOffset}`,
      ar: `تُعرض الأوقات بالتوقيت المحلي لـ ${location.name} (${localOffset}). هاتفك مضبوط على ${deviceOffset}`,
      ur: `اوقات ${location.name} کے مقامی وقت میں دکھائے گئے ہیں (${localOffset})۔ آپ کا فون ${deviceOffset} پر ہے`,
    });
  }

  if (device === osloOffsetMinutes(now)) return null;
  const deviceOffset = formatUtcOffset(device);
  return t({
    nb: `Tidene gjelder ${location.name} i norsk tid, vist i din lokale tid (${deviceOffset})`,
    en: `Times are for ${location.name} in Norwegian time, shown in your local time (${deviceOffset})`,
    ar: `الأوقات خاصة بـ ${location.name} بتوقيت النرويج، معروضة بتوقيتك المحلي (${deviceOffset})`,
    ur: `اوقات ${location.name} کے لیے ناروے کے وقت میں ہیں، آپ کے مقامی وقت میں دکھائے گئے (${deviceOffset})`,
  });
}
