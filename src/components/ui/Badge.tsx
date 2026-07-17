import { View, type StyleProp, type ViewStyle } from 'react-native';
import { AppText } from './AppText';
import { useTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';

type BadgeVariant = 'primary' | 'accent' | 'neutral';

export type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
  style?: StyleProp<ViewStyle>;
};

export function Badge({ label, variant = 'primary', style }: BadgeProps) {
  const theme = useTheme();

  const backgrounds: Record<BadgeVariant, string> = {
    primary: theme.colors.primarySoft,
    accent: theme.colors.accent,
    neutral: theme.colors.surfaceSunken,
  };

  const colors: Record<BadgeVariant, string> = {
    primary: theme.colors.onPrimarySoft,
    accent: theme.colors.onAccent,
    neutral: theme.colors.textSecondary,
  };

  return (
    <View
      style={[
        {
          backgroundColor: backgrounds[variant],
          borderRadius: radius.full,
          paddingVertical: spacing.xxs,
          paddingHorizontal: spacing.sm,
          alignSelf: 'flex-start',
        },
        style,
      ]}>
      <AppText size="xs" weight="semibold" color={colors[variant]}>
        {label}
      </AppText>
    </View>
  );
}
