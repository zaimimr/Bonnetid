import { useEffect } from 'react';
import { type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/theme';
import { radius, type RadiusToken } from '@/theme/tokens';

export type SkeletonProps = {
  width?: DimensionValue;
  height?: number;
  rounded?: RadiusToken;
  style?: StyleProp<ViewStyle>;
};

export function Skeleton({ width = '100%', height = 16, rounded = 'sm', style }: SkeletonProps) {
  const theme = useTheme();
  const pulse = useSharedValue(0.6);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius[rounded],
          backgroundColor: theme.colors.skeleton,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}
