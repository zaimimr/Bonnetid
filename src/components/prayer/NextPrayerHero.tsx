import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Badge, Card } from '@/components/ui';
import { useTheme } from '@/theme';
import { hitSlop, opacity, radius, spacing } from '@/theme/tokens';
import type { NextPrayerResult } from '@/lib/prayerSchedule';
import { formatCountdown } from '@/lib/time';

export type NextPrayerHeroProps = {
  nextPrayer: NextPrayerResult;
  now: Date;
  locationName: string;
  hijriText: string;
  gregorianText: string;
  onPressLocation: () => void;
};

export function NextPrayerHero({
  nextPrayer,
  now,
  locationName,
  hijriText,
  gregorianText,
  onPressLocation,
}: NextPrayerHeroProps) {
  const theme = useTheme();
  const remaining = nextPrayer.next.date.getTime() - now.getTime();
  const current = nextPrayer.current;

  return (
    <Card rounded="xl" padding="xl" elevated>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable
          onPress={onPressLocation}
          hitSlop={hitSlop}
          style={({ pressed }) => [
            {
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.xs,
              backgroundColor: theme.colors.surfaceSunken,
              borderRadius: radius.full,
              paddingVertical: spacing.xs,
              paddingHorizontal: spacing.md,
            },
            pressed && { opacity: opacity.pressed },
          ]}>
          <Ionicons name="location-outline" size={15} color={theme.colors.primary} />
          <AppText size="sm" weight="medium" tone="textSecondary">
            {locationName}
          </AppText>
          <Ionicons name="chevron-down" size={13} color={theme.colors.textMuted} />
        </Pressable>
        {current && (
          <Badge label={`${current.label} startet ${current.time}`} variant="primary" />
        )}
      </View>

      <View style={{ marginTop: spacing.xl, gap: spacing.xxs }}>
        <AppText size="sm" weight="medium" tone="textMuted">
          {nextPrayer.isTomorrow ? 'Neste bønn i morgen' : 'Neste bønn'}
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.md }}>
          <AppText size="display" weight="bold" tone="primary" heading>
            {nextPrayer.next.label}
          </AppText>
          <AppText size="xxl" weight="semibold" tabular>
            {nextPrayer.next.time}
          </AppText>
        </View>
        <AppText size="lg" weight="medium" tone="textSecondary" tabular>
          om {formatCountdown(remaining)}
        </AppText>
      </View>

      <View
        style={{
          marginTop: spacing.xl,
          paddingTop: spacing.md,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}>
        <AppText size="sm" tone="textMuted">
          {gregorianText}
        </AppText>
        <AppText size="sm" weight="medium" tone="textSecondary">
          {hijriText}
        </AppText>
      </View>
    </Card>
  );
}
