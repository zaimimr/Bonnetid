import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card } from '@/components/ui';
import { useTheme } from '@/theme';
import { hitSlop, opacity, spacing } from '@/theme/tokens';
import type { NextPrayerResult } from '@/lib/prayerSchedule';
import { formatCountdown } from '@/lib/time';

export type NextPrayerHeroProps = {
  nextPrayer: NextPrayerResult;
  now: Date;
  hijriText: string;
  gregorianText: string;
  onPressDate?: () => void;
};

export function NextPrayerHero({
  nextPrayer,
  now,
  hijriText,
  gregorianText,
  onPressDate,
}: NextPrayerHeroProps) {
  const theme = useTheme();
  const current = nextPrayer.current;
  const countdownTarget = current?.end?.date ?? nextPrayer.next.date;
  const countdownLabel = current ? (current.end?.label ?? nextPrayer.next.label) : null;
  const remaining = countdownTarget.getTime() - now.getTime();

  return (
    <Card rounded="xl" padding="xl" elevated>
      <View style={{ gap: spacing.xxs }}>
        <AppText size="sm" weight="medium" tone="textMuted">
          {current ? 'Nåværende bønn' : nextPrayer.isTomorrow ? 'Neste bønn i morgen' : 'Neste bønn'}
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.md }}>
          <AppText size="display" weight="bold" tone="primary" heading>
            {current ? current.label : nextPrayer.next.label}
          </AppText>
          <AppText size="xxl" weight="semibold" tabular>
            {current ? current.time : nextPrayer.next.time}
          </AppText>
        </View>
        <AppText size="sm" weight="medium" tone="textSecondary" tabular>
          {countdownLabel
            ? `${countdownLabel} om ${formatCountdown(remaining)}`
            : `om ${formatCountdown(remaining)}`}
        </AppText>
      </View>

      <Pressable
        onPress={onPressDate}
        disabled={!onPressDate}
        hitSlop={hitSlop}
        style={({ pressed }) => [
          {
            marginTop: spacing.xl,
            paddingTop: spacing.md,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          },
          pressed && { opacity: opacity.pressed },
        ]}>
        <AppText size="sm" tone="textMuted">
          {gregorianText}
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <AppText size="sm" weight="medium" tone="textSecondary">
            {hijriText}
          </AppText>
          {onPressDate && (
            <Ionicons name="chevron-forward" size={14} color={theme.colors.textMuted} />
          )}
        </View>
      </Pressable>
    </Card>
  );
}
