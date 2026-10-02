import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';

const DOT = 8;
const ACTIVE = 24;

function Pip({ state }: { state: 'done' | 'active' | 'next' }) {
  const theme = useTheme();
  const width = useSharedValue(state === 'active' ? ACTIVE : DOT);

  useEffect(() => {
    width.value = withTiming(state === 'active' ? ACTIVE : DOT, {
      duration: 300,
      reduceMotion: ReduceMotion.System,
    });
  }, [state, width]);

  const style = useAnimatedStyle(() => ({ width: width.value }));

  return (
    <Animated.View
      style={[
        {
          height: DOT,
          borderRadius: radius.full,
          backgroundColor: state === 'next' ? theme.colors.trackMarker : theme.colors.primary,
          opacity: state === 'done' ? 0.45 : 1,
        },
        style,
      ]}
    />
  );
}

export function StepPips({ step, total }: { step: number; total: number }) {
  return (
    <View
      accessibilityLabel={`Runde ${step + 1} av ${total}`}
      style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.sm }}>
      {Array.from({ length: total }, (_, index) => (
        <Pip key={index} state={index < step ? 'done' : index === step ? 'active' : 'next'} />
      ))}
    </View>
  );
}
