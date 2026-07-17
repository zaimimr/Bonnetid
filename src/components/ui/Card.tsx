import type { PropsWithChildren } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme';
import { opacity, radius, spacing, type RadiusToken, type SpacingToken } from '@/theme/tokens';

export type CardProps = PropsWithChildren<{
  onPress?: () => void;
  padding?: SpacingToken;
  rounded?: RadiusToken;
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
}>;

export function Card({
  children,
  onPress,
  padding = 'lg',
  rounded = 'lg',
  elevated = false,
  style,
}: CardProps) {
  const theme = useTheme();

  const base: ViewStyle = {
    backgroundColor: elevated ? theme.colors.surfaceElevated : theme.colors.surface,
    borderRadius: radius[rounded],
    padding: spacing[padding],
    borderWidth: 1,
    borderColor: theme.colors.border,
  };

  const shadow: ViewStyle = elevated
    ? {
        shadowColor: '#000',
        shadowOpacity: theme.scheme === 'dark' ? 0.4 : 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
      }
    : {};

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [base, shadow, pressed && { opacity: opacity.pressed }, style]}>
        {children}
      </Pressable>
    );
  }

  return <View style={[base, shadow, style]}>{children}</View>;
}
