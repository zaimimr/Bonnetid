import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { Button } from './Button';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';

export function ErrorState({
  message = 'Noe gikk galt. Prøv igjen.',
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
        <Button label="Prøv igjen" variant="secondary" onPress={onRetry} style={{ alignSelf: 'center' }} />
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
        {`Bønnetidene for ${period} er ikke publisert ennå`}
      </AppText>
      <Button label="Prøv igjen" variant="secondary" onPress={onRetry} style={{ alignSelf: 'center' }} />
    </View>
  );
}
