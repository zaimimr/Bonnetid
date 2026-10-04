import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card } from '@/components/ui';
import { useTheme } from '@/theme';
import { hitSlop, opacity, spacing } from '@/theme/tokens';
import type { NextPrayerResult } from '@/lib/prayerSchedule';
import { formatCountdown } from '@/lib/time';

export type EidHeroPrayer = {
  title: string;
  mosqueName: string;
  times: string[];
  next: Date | null;
};

export type NextPrayerHeroProps = {
  nextPrayer: NextPrayerResult | null;
  eidPrayer?: EidHeroPrayer | null;
  now: Date;
  hijriText: string;
  gregorianText: string;
  onPressDate?: () => void;
};

export function NextPrayerHero({
  nextPrayer,
  eidPrayer,
  now,
  hijriText,
  gregorianText,
  onPressDate,
}: NextPrayerHeroProps) {
  const theme = useTheme();

  return (
    <Card rounded="xl" padding="xl" elevated>
      {eidPrayer ? (
        <EidPrayerBlock prayer={eidPrayer} now={now} />
      ) : (
        nextPrayer && <NextPrayerBlock nextPrayer={nextPrayer} now={now} />
      )}
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
            gap: spacing.md,
          },
          pressed && { opacity: opacity.pressed },
        ]}>
        <View style={{ flex: 1, gap: spacing.xxs }}>
          <AppText size="sm" tone="textMuted">
            {gregorianText}
          </AppText>
          <AppText size="sm" weight="medium" tone="textSecondary">
            {hijriText}
          </AppText>
        </View>
        {onPressDate && <Ionicons name="chevron-forward" size={14} color={theme.colors.textMuted} />}
      </Pressable>
    </Card>
  );
}

function NextPrayerBlock({ nextPrayer, now }: { nextPrayer: NextPrayerResult; now: Date }) {
  const current = nextPrayer.current;
  const countdownTarget = current?.end?.date ?? nextPrayer.next.date;
  const countdownLabel = current ? (current.end?.label ?? nextPrayer.next.label) : null;
  const remaining = countdownTarget.getTime() - now.getTime();

  return (
    <View style={{ gap: spacing.xxs }}>
      <AppText size="sm" weight="medium" tone="textMuted">
        {current ? 'Nåværende bønn' : nextPrayer.isTomorrow ? 'Neste bønn i morgen' : 'Neste bønn'}
      </AppText>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'baseline',
          columnGap: spacing.md,
          rowGap: spacing.xxs,
        }}>
        <AppText
          size="display"
          weight="bold"
          tone="primary"
          heading
          style={{ flexShrink: 0 }}>
          {current ? current.label : nextPrayer.next.label}
        </AppText>
        <AppText size="xxl" weight="semibold" tabular style={{ flexShrink: 0 }}>
          {current ? current.time : nextPrayer.next.time}
        </AppText>
      </View>
      <AppText size="sm" weight="medium" tone="textSecondary" tabular>
        {countdownLabel
          ? `${countdownLabel} om ${formatCountdown(remaining)}`
          : `om ${formatCountdown(remaining)}`}
      </AppText>
    </View>
  );
}

function EidPrayerBlock({ prayer, now }: { prayer: EidHeroPrayer; now: Date }) {
  return (
    <View style={{ gap: spacing.xxs }}>
      <AppText size="sm" weight="medium" tone="textMuted">
        {prayer.title}
      </AppText>
      <AppText size="xxl" weight="bold" tone="primary" heading>
        {prayer.mosqueName}
      </AppText>
      <AppText size="xl" weight="semibold" tabular>
        {prayer.times.join(' · ')}
      </AppText>
      <AppText size="sm" weight="medium" tone="textSecondary" tabular>
        {prayer.next ? `om ${formatCountdown(prayer.next.getTime() - now.getTime())}` : 'Pågår'}
      </AppText>
    </View>
  );
}
