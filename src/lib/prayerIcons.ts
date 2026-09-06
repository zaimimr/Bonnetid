import type { PrayerName } from './prayerSchedule';

export type PrayerIconFamily = 'ionicons' | 'feather' | 'material-community';

export type PrayerIcon = {
  family: PrayerIconFamily;
  name: string;
};

export const PRAYER_ICONS: Record<PrayerName, PrayerIcon> = {
  fajr: { family: 'material-community', name: 'weather-night' },
  fajr_endtime: { family: 'feather', name: 'sunrise' },
  duhr: { family: 'ionicons', name: 'sunny' },
  asr: { family: 'ionicons', name: 'partly-sunny-outline' },
  maghrib: { family: 'feather', name: 'sunset' },
  isha: { family: 'ionicons', name: 'moon' },
};

export function prayerIcon(name: PrayerName): PrayerIcon {
  return PRAYER_ICONS[name];
}
