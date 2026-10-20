import { type StyleProp, type ViewStyle } from 'react-native';
import { Icon, type IconName } from '@/components/icons';
import { useTheme } from '@/theme';
import { hitSlop, opacity, pressScale, radius } from '@/theme/tokens';
import { PressableScale } from './PressableScale';

const SIZE = 44;
const ICON_SIZE = 20;

export type IconButtonProps = {
  name: IconName;
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
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      scaleTo={pressScale.control}
      style={[
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
        style,
      ]}>
      <Icon name={name} size={ICON_SIZE} color={theme.colors.textPrimary} />
    </PressableScale>
  );
}
