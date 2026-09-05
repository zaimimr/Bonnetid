import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui';
import { HALAL_DISCLAIMER, HALAL_SHORT_DISCLAIMER } from '@/lib/halalCopy';
import { useTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';

export function Disclaimer({ compact = false }: { compact?: boolean }) {
  const theme = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.sm,
        backgroundColor: theme.colors.surfaceSunken,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
      }}>
      <Ionicons
        name="information-circle-outline"
        size={16}
        color={theme.colors.textMuted}
        style={{ marginTop: 2 }}
      />
      <AppText size="xs" tone="textSecondary" style={{ flex: 1 }}>
        {compact ? HALAL_SHORT_DISCLAIMER : HALAL_DISCLAIMER}
      </AppText>
    </View>
  );
}
