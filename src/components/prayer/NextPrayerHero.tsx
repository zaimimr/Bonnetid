import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { t } from '@/lib/i18n';
import { AppText, Card, mirrored } from '@/components/ui';
import { useTheme } from '@/theme';
import { hitSlop, opacity, spacing } from '@/theme/tokens';
import type { NextPrayerResult } from '@/lib/prayerSchedule';
import { formatCountdown } from '@/lib/time';

function inCountdown(countdown: string): string {
  return t({
    nb: `om ${countdown}`,
    en: `in ${countdown}`,
    ar: `بعد ${countdown}`,
    ur: `${countdown} میں`,
  });
}

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
        {onPressDate && <Ionicons name="chevron-forward" size={14} color={theme.colors.textMuted} style={mirrored} />}
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
        {current
          ? t({ nb: 'Nåværende bønn', en: 'Current prayer', ar: 'الصلاة الحالية', ur: 'موجودہ نماز' })
          : nextPrayer.isTomorrow
            ? t({ nb: 'Neste bønn i morgen', en: 'Next prayer tomorrow', ar: 'الصلاة التالية غدًا', ur: 'اگلی نماز کل' })
            : t({ nb: 'Neste bønn', en: 'Next prayer', ar: 'الصلاة التالية', ur: 'اگلی نماز' })}
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
          ? t({
              nb: `${countdownLabel} om ${formatCountdown(remaining)}`,
              en: `${countdownLabel} in ${formatCountdown(remaining)}`,
              ar: `${countdownLabel} بعد ${formatCountdown(remaining)}`,
              ur: `${countdownLabel} ${formatCountdown(remaining)} میں`,
            })
          : inCountdown(formatCountdown(remaining))}
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
        {prayer.next
          ? inCountdown(formatCountdown(prayer.next.getTime() - now.getTime()))
          : t({ nb: 'Pågår', en: 'In progress', ar: 'جارية الآن', ur: 'جاری ہے' })}
      </AppText>
    </View>
  );
}
