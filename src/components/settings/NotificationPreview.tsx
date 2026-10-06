import { View } from 'react-native';
import { Image } from 'expo-image';
import { PostHogMaskView } from 'posthog-react-native';
import { AppText, Card } from '@/components/ui';
import { useNow } from '@/hooks/useNow';
import { usePrayerDay } from '@/hooks/usePrayerDay';
import { t } from '@/lib/i18n';
import { useActiveLocation } from '@/store/settings';
import { opacity, radius, spacing } from '@/theme/tokens';

export function NotificationPreview({ enabled }: { enabled: boolean }) {
  const now = useNow(60_000);
  const location = useActiveLocation();
  const next = usePrayerDay(now).nextPrayer?.next;
  if (!next) return null;

  return (
    <Card rounded="xl" padding="md" elevated style={{ opacity: enabled ? 1 : opacity.disabled }}>
      <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' }}>
        <Image
          source={require('../../../assets/images/logo.png')}
          style={{ width: 36, height: 36, borderRadius: radius.sm }}
          contentFit="contain"
        />
        <View style={{ flex: 1, gap: spacing.xxs }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm }}>
            <AppText weight="semibold" tabular>
              {`${next.label} ${next.time}`}
            </AppText>
            <AppText size="xs" tone="textMuted">
              {t('settings.now')}
            </AppText>
          </View>
          <PostHogMaskView>
            <AppText size="sm" tone="textSecondary">
              {t('settings.itIsTimeFor', { label: next.label, name: location.name })}
            </AppText>
          </PostHogMaskView>
        </View>
      </View>
    </Card>
  );
}
