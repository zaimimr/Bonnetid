import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { prayerIcon } from '@/lib/prayerIcons';
import type { PrayerName } from '@/lib/prayerSchedule';

export type PrayerIconProps = {
  name: PrayerName;
  size: number;
  color: string;
};

export function PrayerIcon({ name, size, color }: PrayerIconProps) {
  const icon = prayerIcon(name);

  if (icon.family === 'feather') {
    return <Feather name={icon.name as keyof typeof Feather.glyphMap} size={size} color={color} />;
  }

  if (icon.family === 'material-community') {
    return (
      <MaterialCommunityIcons
        name={icon.name as keyof typeof MaterialCommunityIcons.glyphMap}
        size={size}
        color={color}
      />
    );
  }

  return <Ionicons name={icon.name as keyof typeof Ionicons.glyphMap} size={size} color={color} />;
}
