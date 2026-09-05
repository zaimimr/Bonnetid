import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui';
import { useFontScale } from '@/hooks/useFontScale';
import { basisExplanation, verdictSummary, verdictTitle } from '@/lib/halalCopy';
import type { HalalVerdictResult } from '@/lib/halalVerdict';
import { useTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';
import { verdictStyle } from './verdictStyle';

export function VerdictHeader({ result }: { result: HalalVerdictResult }) {
  const theme = useTheme();
  const { isStacked } = useFontScale();
  const style = verdictStyle(theme, result.verdict);
  const explanation = basisExplanation(result.basis);

  return (
    <View
      style={{
        backgroundColor: style.surface,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: style.tint,
        padding: spacing.xl,
        gap: spacing.md,
      }}>
      <View
        style={{
          flexDirection: isStacked ? 'column' : 'row',
          alignItems: isStacked ? 'flex-start' : 'center',
          gap: spacing.md,
        }}>
        <Ionicons name={style.icon} size={isStacked ? 36 : 44} color={style.tint} />
        <View style={{ flex: isStacked ? undefined : 1, gap: spacing.xxs }}>
          <AppText size="xl" weight="bold" heading color={style.onSurface}>
            {verdictTitle(result.verdict)}
          </AppText>
          <AppText size="sm" color={style.onSurface}>
            {verdictSummary(result.verdict)}
          </AppText>
        </View>
      </View>

      {explanation ? (
        <AppText size="sm" color={style.onSurface}>
          {explanation}
        </AppText>
      ) : null}
    </View>
  );
}
