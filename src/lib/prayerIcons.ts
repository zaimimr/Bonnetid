import type { IconName } from '@/components/icons';
import type { PrayerName } from './prayerSchedule';

export const PRAYER_ICONS: Record<PrayerName, IconName> = {
  fajr: 'moon-stars',
  fajr_endtime: 'sunrise',
  duhr: 'sun',
  asr: 'cloud-sun',
  maghrib: 'sunset',
  isha: 'moon',
};

export function prayerIcon(name: PrayerName): IconName {
  return PRAYER_ICONS[name];
}
