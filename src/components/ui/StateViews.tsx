import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { Button } from './Button';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';
import { t } from '@/lib/i18n';

export function ErrorState({
  message = t('common.somethingWentWrongTry'),
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxxl }}>
      <Ionicons name="cloud-offline-outline" size={40} color={theme.colors.textMuted} />
      <AppText tone="textSecondary" align="center">
        {message}
      </AppText>
      {onRetry && (
        <Button label={t('common.tryAgain')} variant="secondary" onPress={onRetry} style={{ alignSelf: 'center' }} />
      )}
    </View>
  );
}

export function EmptyState({
  message,
  icon = 'search-outline',
}: {
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const theme = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxxl }}>
      <Ionicons name={icon} size={40} color={theme.colors.textMuted} />
      <AppText tone="textSecondary" align="center">
        {message}
      </AppText>
    </View>
  );
}

export function NoTimesState({ period, onRetry }: { period: string; onRetry: () => void }) {
  const theme = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxxl }}>
      <Ionicons name="calendar-clear-outline" size={40} color={theme.colors.textMuted} />
      <AppText tone="textSecondary" align="center">
        {t('common.prayerTimesForHave', { period })}
      </AppText>
      <Button label={t('common.tryAgain')} variant="secondary" onPress={onRetry} style={{ alignSelf: 'center' }} />
    </View>
  );
}
