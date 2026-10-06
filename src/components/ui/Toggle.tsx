import { Pressable } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';
import { isRTL } from '@/lib/i18n';
import { useTheme } from '@/theme';
import { opacity } from '@/theme/tokens';

const TRACK_WIDTH = 51;
const TRACK_HEIGHT = 31;
const THUMB_SIZE = 27;
const INSET = 2;
const TRAVEL = TRACK_WIDTH - THUMB_SIZE - INSET * 2;

export type ToggleProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
};

export function Toggle({ value, onValueChange, disabled = false, accessibilityLabel }: ToggleProps) {
  const theme = useTheme();
  const progress = useDerivedValue(() => withTiming(value ? 1 : 0, { duration: 180 }));
  const offTrack = theme.colors.borderStrong;
  const onTrack = theme.colors.primary;

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [offTrack, onTrack]),
  }));

  const rtl = isRTL();
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (rtl ? 1 - progress.value : progress.value) * TRAVEL }],
  }));

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled }}
      style={disabled ? { opacity: opacity.disabled } : undefined}>
      <Animated.View
        style={[
          {
            width: TRACK_WIDTH,
            height: TRACK_HEIGHT,
            borderRadius: TRACK_HEIGHT / 2,
            padding: INSET,
            justifyContent: 'center',
            direction: 'ltr',
          },
          trackStyle,
        ]}>
        <Animated.View
          style={[
            {
              width: THUMB_SIZE,
              height: THUMB_SIZE,
              borderRadius: THUMB_SIZE / 2,
              backgroundColor: theme.colors.switchThumb,
              shadowColor: '#000',
              shadowOpacity: 0.15,
              shadowRadius: 2,
              shadowOffset: { width: 0, height: 1 },
              elevation: disabled ? 0 : 2,
            },
            thumbStyle,
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}
