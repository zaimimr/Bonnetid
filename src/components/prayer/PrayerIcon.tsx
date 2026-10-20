import { Icon } from '@/components/icons';
import { prayerIcon } from '@/lib/prayerIcons';
import type { PrayerName } from '@/lib/prayerSchedule';

export type PrayerIconProps = {
  name: PrayerName;
  size: number;
  color: string;
};

export function PrayerIcon({ name, size, color }: PrayerIconProps) {
  return <Icon name={prayerIcon(name)} size={size} color={color} />;
}
