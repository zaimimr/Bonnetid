import { Pressable } from 'react-native';
import { Icon } from '@/components/icons';
import { AppText } from '@/components/ui';
import { useTheme } from '@/theme';
import { opacity, radius, spacing } from '@/theme/tokens';

export function DashedButton({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        minHeight: 48,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: theme.colors.seriesLight,
        opacity: pressed ? opacity.pressed : 1,
      })}>
      <Icon name="plus-circle" size={20} color={theme.colors.primary} />
      <AppText weight="semibold" tone="primary">
        {label}
      </AppText>
    </Pressable>
  );
}
