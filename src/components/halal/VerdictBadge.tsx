import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui';
import { verdictTitle } from '@/lib/halalCopy';
import type { HalalVerdict } from '@/lib/halalVerdict';
import { useTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';
import { verdictStyle } from './verdictStyle';

export function VerdictBadge({ verdict }: { verdict: HalalVerdict }) {
  const theme = useTheme();
  const style = verdictStyle(theme, verdict);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        backgroundColor: style.surface,
        borderRadius: radius.full,
        paddingVertical: spacing.xxs,
        paddingHorizontal: spacing.sm,
        alignSelf: 'flex-start',
      }}>
      <Ionicons name={style.icon} size={14} color={style.onSurface} />
      <AppText size="xs" weight="semibold" color={style.onSurface}>
        {verdictTitle(verdict)}
      </AppText>
    </View>
  );
}
