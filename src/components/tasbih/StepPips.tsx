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

function Pip({ state, complete }: { state: 'done' | 'active' | 'next'; complete: boolean }) {
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
          opacity: state === 'done' && !complete ? 0.45 : 1,
        },
        style,
      ]}
    />
  );
}

export function StepPips({
  step,
  total,
  complete = false,
}: {
  step: number;
  total: number;
  complete?: boolean;
}) {
  return (
    <View
      accessibilityLabel={complete ? 'Alle runder fullført' : `Runde ${step + 1} av ${total}`}
      style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.sm }}>
      {Array.from({ length: total }, (_, index) => (
        <Pip
          key={index}
          complete={complete}
          state={complete || index < step ? 'done' : index === step ? 'active' : 'next'}
        />
      ))}
    </View>
  );
}
