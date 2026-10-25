import { View } from 'react-native';
import { Icon } from '@/components/icons';
import { t } from '@/lib/i18n';
import { AppText } from '@/components/ui';
import { useServiceStatus } from '@/store/serviceStatus';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';

export function OutageBanner() {
  const theme = useTheme();
  const down = useServiceStatus((state) => state.down);

  if (!down) return null;

  return (
    <View
      accessibilityRole="alert"
      style={{
        backgroundColor: theme.colors.noticeSoft,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
      }}>
      <Icon name="cloud-slash" size={18} color={theme.colors.onNoticeSoft} />
      <View style={{ flex: 1 }}>
        <AppText size="sm" weight="semibold" style={{ color: theme.colors.onNoticeSoft }}>
          {t('common.outageTitle')}
        </AppText>
        <AppText size="xs" style={{ color: theme.colors.onNoticeSoft }}>
          {t('common.outageBody')}
        </AppText>
      </View>
    </View>
  );
}
