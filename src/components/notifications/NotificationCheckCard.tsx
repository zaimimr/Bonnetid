import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { t } from '@/lib/i18n';
import { AppText, Card, mirrored } from '@/components/ui';
import { useNotificationHealth } from '@/hooks/useNotificationHealth';
import { NOTIFICATION_ISSUE_LABELS } from '@/lib/notificationHealth';
import { track } from '@/lib/telemetry';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';

export function NotificationCheckCard() {
  const theme = useTheme();
  const router = useRouter();
  const { issues } = useNotificationHealth();
  const broken = issues.find((issue) => issue.severity === 'broken');

  if (!broken) return null;

  return (
    <Card
      rounded="xl"
      onPress={() => {
        track('notification_check_card_tapped', { issue: broken.key });
        router.push('/notification-check');
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Ionicons name="alert-circle" size={24} color={theme.colors.danger} />
        <View style={{ flex: 1 }}>
          <AppText weight="semibold">
            {t({
              nb: 'Bønnevarsler virker ikke',
              en: 'Prayer notifications are not working',
              ar: 'إشعارات الصلاة لا تعمل',
              ur: 'نماز کی اطلاعات کام نہیں کر رہیں',
            })}
          </AppText>
          <AppText size="sm" tone="textMuted">
            {NOTIFICATION_ISSUE_LABELS[broken.key]}
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} style={mirrored} />
      </View>
    </Card>
  );
}
