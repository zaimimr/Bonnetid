import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { pressScale, spring } from '@/theme/tokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type PressableScaleProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
};

export function PressableScale({
  scaleTo = pressScale.card,
  onPressIn,
  onPressOut,
  style,
  ...props
}: PressableScaleProps) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  const to = (value: number) =>
    withSpring(value, { ...spring.press, reduceMotion: ReduceMotion.System });

  return (
    <AnimatedPressable
      {...props}
      onPressIn={(event) => {
        scale.set(to(scaleTo));
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.set(to(1));
        onPressOut?.(event);
      }}
      style={[style, animated]}
    />
  );
}
