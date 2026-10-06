import { View } from 'react-native';
import { AppText, Card } from '@/components/ui';
import { PrayerIcon } from '@/components/prayer/PrayerIcon';
import { useNow } from '@/hooks/useNow';
import { usePrayerDay } from '@/hooks/usePrayerDay';
import { formatDurationSpaced } from '@/lib/time';
import { t } from '@/lib/i18n';
import { useTheme } from '@/theme';
import { opacity, radius, spacing } from '@/theme/tokens';

function Pill({ label, primary }: { label: string; primary?: boolean }) {
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        paddingVertical: spacing.sm,
        borderRadius: radius.full,
        backgroundColor: primary ? theme.colors.primary : theme.colors.primarySoft,
      }}>
      <AppText size="sm" weight="semibold" color={primary ? theme.colors.onPrimary : theme.colors.onPrimarySoft}>
        {label}
      </AppText>
    </View>
  );
}

export function LockScreenPreview({ enabled, tracker }: { enabled: boolean; tracker: boolean | null }) {
  const theme = useTheme();
  const now = useNow(60_000);
  const day = usePrayerDay(now).nextPrayer;
  if (!day) return null;
  const remaining = formatDurationSpaced(day.next.date.getTime() - now.getTime());

  return (
    <Card rounded="xl" padding="md" elevated style={{ gap: spacing.md, opacity: enabled ? 1 : opacity.disabled }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <PrayerIcon name={day.next.name} size={28} color={theme.colors.primary} />
        <View style={{ flex: 1, gap: spacing.xxs }}>
          <AppText weight="semibold">{day.next.label}</AppText>
          <AppText size="sm" tone="textMuted" tabular>
            {day.next.time}
          </AppText>
        </View>
        <AppText size="lg" weight="semibold" tabular>
          {t('settings.in', { remaining })}
        </AppText>
      </View>
      {tracker !== null && (
        <View style={{ flexDirection: 'row', gap: spacing.sm, opacity: tracker ? 1 : opacity.disabled }}>
          <Pill label={t('settings.prayed')} primary />
          <Pill label={t('settings.skip')} />
        </View>
      )}
    </Card>
  );
}
