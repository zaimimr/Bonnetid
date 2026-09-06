import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { hitSlop, opacity, radius } from '@/theme/tokens';

const SIZE = 44;
const ICON_SIZE = 20;

export type IconButtonProps = {
  name: keyof typeof Ionicons.glyphMap;
  accessibilityLabel: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function IconButton({
  name,
  accessibilityLabel,
  onPress,
  disabled = false,
  style,
}: IconButtonProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        {
          width: SIZE,
          height: SIZE,
          borderRadius: radius.full,
          backgroundColor: theme.colors.surfaceSunken,
          borderWidth: 1,
          borderColor: theme.colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? opacity.disabled : 1,
        },
        pressed && !disabled && { opacity: opacity.pressed },
        style,
      ]}>
      <Ionicons name={name} size={ICON_SIZE} color={theme.colors.textPrimary} />
    </Pressable>
  );
}
