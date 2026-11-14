import { Pressable } from 'react-native';
import { AppText } from '@/components/ui';
import { useTheme } from '@/theme';
import { opacity, radius, spacing } from '@/theme/tokens';

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => ({
        minHeight: 36,
        justifyContent: 'center',
        paddingHorizontal: spacing.md,
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: selected ? theme.colors.primary : theme.colors.border,
        backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
        opacity: pressed ? opacity.pressed : 1,
      })}>
      <AppText size="sm" weight="semibold" color={selected ? theme.colors.onPrimary : theme.colors.textPrimary}>
        {label}
      </AppText>
    </Pressable>
  );
}
