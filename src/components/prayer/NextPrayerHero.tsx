import { Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui';
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

  return (
    <LinearGradient
      colors={[theme.colors.heroGradientStart, theme.colors.heroGradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderRadius: radius.xl,
        padding: spacing.xxl,
        gap: spacing.sm,
      }}>
      <Pressable
        onPress={onPressLocation}
        hitSlop={hitSlop}
        style={({ pressed }) => [
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs,
            alignSelf: 'flex-start',
          },
          pressed && { opacity: opacity.pressed },
        ]}>
        <Ionicons name="location-outline" size={16} color={theme.colors.onHeroMuted} />
        <AppText size="sm" weight="medium" tone="onHeroMuted">
          {locationName}
        </AppText>
        <Ionicons name="chevron-down" size={14} color={theme.colors.onHeroMuted} />
      </Pressable>

      <View style={{ gap: spacing.xxs, marginTop: spacing.sm }}>
        <AppText size="sm" tone="onHeroMuted">
          {nextPrayer.isTomorrow ? 'Neste bønn i morgen' : 'Neste bønn'}
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.md }}>
          <AppText size="display" weight="bold" tone="onHero" heading>
            {nextPrayer.next.label}
          </AppText>
          <AppText size="xxl" weight="medium" tone="onHeroMuted" tabular>
            {nextPrayer.next.time}
          </AppText>
        </View>
        <AppText size="lg" weight="semibold" tone="onHero" tabular>
          om {formatCountdown(remaining)}
        </AppText>
      </View>

      <View
        style={{
          marginTop: spacing.lg,
          paddingTop: spacing.md,
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.15)',
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}>
        <AppText size="sm" tone="onHeroMuted">
          {gregorianText}
        </AppText>
        <AppText size="sm" weight="medium" tone="onHeroMuted">
          {hijriText}
        </AppText>
      </View>
    </LinearGradient>
  );
}
