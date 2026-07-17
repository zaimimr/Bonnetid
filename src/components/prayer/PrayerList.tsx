import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Badge, Card } from '@/components/ui';
import { useTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';
import type { PrayerEntry, PrayerName } from '@/lib/prayerSchedule';

const PRAYER_ICONS: Record<PrayerName, keyof typeof Ionicons.glyphMap> = {
  fajr: 'cloudy-night-outline',
  shuruq: 'sunny-outline',
  duhr: 'sunny',
  asr: 'partly-sunny-outline',
  maghrib: 'moon-outline',
  isha: 'moon',
};

export type PrayerListProps = {
  schedule: PrayerEntry[];
  highlightedName?: PrayerName;
};

export function PrayerList({ schedule, highlightedName }: PrayerListProps) {
  const theme = useTheme();

  return (
    <Card padding="sm" rounded="xl">
      {schedule.map((entry, index) => {
        const isHighlighted = entry.name === highlightedName;
        return (
          <View
            key={entry.name}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.md,
              borderRadius: radius.lg,
              backgroundColor: isHighlighted ? theme.colors.primarySoft : 'transparent',
              borderBottomWidth: index === schedule.length - 1 || isHighlighted ? 0 : 1,
              borderBottomColor: theme.colors.border,
            }}>
            <Ionicons
              name={PRAYER_ICONS[entry.name]}
              size={20}
              color={isHighlighted ? theme.colors.primary : theme.colors.textMuted}
            />
            <AppText
              weight={isHighlighted ? 'bold' : entry.isPrayer ? 'medium' : 'regular'}
              tone={entry.isPrayer ? 'textPrimary' : 'textMuted'}
              style={{ flex: 1 }}>
              {entry.label}
            </AppText>
            {isHighlighted && <Badge label="Neste" variant="primary" />}
            <AppText
              weight={isHighlighted ? 'bold' : 'medium'}
              tone={entry.isPrayer ? 'textPrimary' : 'textMuted'}
              tabular>
              {entry.time}
            </AppText>
          </View>
        );
      })}
    </Card>
  );
}
