import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { Button } from './Button';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';
import { t } from '@/lib/i18n';

export function ErrorState({
  message = t({
    nb: 'Noe gikk galt. Prøv igjen.',
    en: 'Something went wrong. Try again.',
    ar: 'حدث خطأ ما. حاول مرة أخرى.',
    ur: 'کچھ غلط ہو گیا۔ دوبارہ کوشش کریں۔',
  }),
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
        <Button label={t({ nb: 'Prøv igjen', en: 'Try again', ar: 'حاول مرة أخرى', ur: 'دوبارہ کوشش کریں' })} variant="secondary" onPress={onRetry} style={{ alignSelf: 'center' }} />
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
        {t({
          nb: `Bønnetidene for ${period} er ikke publisert ennå`,
          en: `Prayer times for ${period} have not been published yet`,
          ar: `لم تُنشر مواقيت الصلاة لـ ${period} بعد`,
          ur: `${period} کے نماز کے اوقات ابھی شائع نہیں ہوئے`,
        })}
      </AppText>
      <Button label={t({ nb: 'Prøv igjen', en: 'Try again', ar: 'حاول مرة أخرى', ur: 'دوبارہ کوشش کریں' })} variant="secondary" onPress={onRetry} style={{ alignSelf: 'center' }} />
    </View>
  );
}
