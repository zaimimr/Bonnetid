import { ActivityIndicator, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { AppText } from './AppText';
import { useTheme } from '@/theme';
import { opacity, radius, spacing } from '@/theme/tokens';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

const sizePadding: Record<ButtonSize, { vertical: number; horizontal: number }> = {
  sm: { vertical: spacing.sm, horizontal: spacing.md },
  md: { vertical: spacing.md, horizontal: spacing.lg },
  lg: { vertical: spacing.lg, horizontal: spacing.xl },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
}: ButtonProps) {
  const theme = useTheme();

  const backgrounds: Record<ButtonVariant, string> = {
    primary: theme.colors.primary,
    secondary: theme.colors.primarySoft,
    ghost: 'transparent',
    danger: theme.colors.danger,
  };

  const labelColors: Record<ButtonVariant, string> = {
    primary: theme.colors.onPrimary,
    secondary: theme.colors.onPrimarySoft,
    ghost: theme.colors.primary,
    danger: theme.colors.textInverse,
  };

  const container: ViewStyle = {
    backgroundColor: backgrounds[variant],
    borderRadius: radius.full,
    paddingVertical: sizePadding[size].vertical,
    paddingHorizontal: sizePadding[size].horizontal,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    alignSelf: fullWidth ? 'stretch' : 'flex-start',
    minHeight: 44,
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        container,
        pressed && { opacity: opacity.pressed },
        (disabled || loading) && { opacity: opacity.disabled },
        style,
      ]}>
      {loading && <ActivityIndicator size="small" color={labelColors[variant]} />}
      <AppText size={size === 'lg' ? 'lg' : 'md'} weight="semibold" color={labelColors[variant]}>
        {label}
      </AppText>
    </Pressable>
  );
}
