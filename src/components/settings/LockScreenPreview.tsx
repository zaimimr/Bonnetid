import { View } from 'react-native';
import { AppText, Card } from '@/components/ui';
import { PrayerIcon } from '@/components/prayer/PrayerIcon';
import { useNow } from '@/hooks/useNow';
import { usePrayerDay } from '@/hooks/usePrayerDay';
import { formatDurationSpaced } from '@/lib/time';
import { t } from '@/lib/i18n';
import { useTheme } from '@/theme';
import { opacity, spacing } from '@/theme/tokens';

export function LockScreenPreview({ enabled }: { enabled: boolean }) {
  const theme = useTheme();
  const now = useNow(60_000);
  const next = usePrayerDay(now).nextPrayer?.next;
  if (!next) return null;
  const remaining = formatDurationSpaced(next.date.getTime() - now.getTime());

  return (
    <Card rounded="xl" padding="md" elevated style={{ opacity: enabled ? 1 : opacity.disabled }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <PrayerIcon name={next.name} size={28} color={theme.colors.primary} />
        <View style={{ flex: 1, gap: spacing.xxs }}>
          <AppText weight="semibold">{next.label}</AppText>
          <AppText size="sm" tone="textMuted" tabular>
            {next.time}
          </AppText>
        </View>
        <AppText size="lg" weight="semibold" tabular>
          {t({ nb: `om ${remaining}`, en: `in ${remaining}`, ar: `بعد ${remaining}`, ur: `${remaining} میں` })}
        </AppText>
      </View>
    </Card>
  );
}
