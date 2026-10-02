import { useEffect, useState } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { AppText } from '@/components/ui';
import { BEADS_PER_ROUND, SEQUENCE, SEQUENCE_TOTAL } from '@/lib/tasbih';
import { useTheme } from '@/theme';
import { counterType, radius, spacing } from '@/theme/tokens';
import { PhraseBlock } from './PhraseBlock';
import { StepPips } from './StepPips';
import type { TasbihSession } from './useTasbih';

const BEAD = 13;
const MAX_RING = 288;

function Bead({ index, filled, current, x, y }: { index: number; filled: boolean; current: boolean; x: number; y: number }) {
  const theme = useTheme();
  const fill = useSharedValue(filled ? 1 : 0);

  useEffect(() => {
    if (filled) {
      fill.value = withSpring(1, { damping: 14, stiffness: 260, reduceMotion: ReduceMotion.System });
    } else {
      fill.value = withDelay(
        (BEADS_PER_ROUND - index) * 14,
        withTiming(0, { duration: 220, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.System }),
      );
    }
  }, [filled, index, fill]);

  const fillStyle = useAnimatedStyle(() => ({
    opacity: fill.value,
    transform: [{ scale: 0.4 + fill.value * 0.6 }],
  }));

  return (
    <View
      style={{
        position: 'absolute',
        left: x - BEAD / 2,
        top: y - BEAD / 2,
        width: BEAD,
        height: BEAD,
        borderRadius: radius.full,
        backgroundColor: theme.colors.surfaceSunken,
        borderWidth: current ? 2 : 1,
        borderColor: current ? theme.colors.primary : theme.colors.borderStrong,
      }}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: -1,
            left: -1,
            width: BEAD,
            height: BEAD,
            borderRadius: radius.full,
            backgroundColor: theme.colors.primary,
          },
          fillStyle,
        ]}
      />
    </View>
  );
}

function PulseCount({ count }: { count: number }) {
  const theme = useTheme();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (count === 0) return;
    scale.value = withSequence(
      withTiming(1.06, { duration: 70, reduceMotion: ReduceMotion.System }),
      withSpring(1, { damping: 12, stiffness: 300, reduceMotion: ReduceMotion.System }),
    );
  }, [count, scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={style}>
      <Text
        maxFontSizeMultiplier={counterType.maxScale}
        style={{
          fontSize: counterType.size,
          fontWeight: '600',
          color: theme.colors.textPrimary,
          fontVariant: ['tabular-nums'],
          textAlign: 'center',
        }}>
        {count}
      </Text>
    </Animated.View>
  );
}

export function RingVariant({ session }: { session: TasbihSession }) {
  const { width } = useWindowDimensions();
  const { state, phrase, target } = session;
  const [fit, setFit] = useState<number | null>(null);
  const size = Math.min(width - spacing.xxxl * 2, MAX_RING);
  const ringRadius = size / 2 - BEAD;
  const sequence = state.mode === 'sequence';
  const complete = sequence && state.done;
  const filled = state.done
    ? BEADS_PER_ROUND
    : sequence
      ? state.count
      : state.count % BEADS_PER_ROUND;
  const scale = useSharedValue(1);

  useEffect(() => {
    if (fit === null) return;
    scale.value = withTiming(Math.min((fit - spacing.lg) / size, 1), {
      duration: 400,
      easing: Easing.out(Easing.cubic),
      reduceMotion: ReduceMotion.System,
    });
  }, [fit, size, scale]);

  const ringStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View style={{ flex: 1, alignItems: 'center', gap: spacing.md }}>
      <PhraseBlock phrase={phrase} note={complete ? 'Sies én gang' : undefined} compact={complete} />
      <View
        onLayout={(event) => {
          const { width: w, height: h } = event.nativeEvent.layout;
          setFit(Math.min(w, h));
        }}
        style={{ flex: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View
          style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, ringStyle]}>
          {Array.from({ length: BEADS_PER_ROUND }, (_, index) => {
            const angle = (index / BEADS_PER_ROUND) * Math.PI * 2 - Math.PI / 2;
            return (
              <Bead
                key={index}
                index={index}
                filled={index < filled}
                current={!state.done && index === filled}
                x={size / 2 + Math.cos(angle) * ringRadius}
                y={size / 2 + Math.sin(angle) * ringRadius}
              />
            );
          })}
          <PulseCount count={complete ? SEQUENCE_TOTAL : state.count} />
          {complete ? (
            <AppText size="sm" tone="textMuted">
              til sammen
            </AppText>
          ) : target ? (
            <AppText size="sm" tone="textMuted" tabular>
              av {target}
            </AppText>
          ) : null}
        </Animated.View>
      </View>
      <View style={{ height: 8 }}>
        {sequence ? <StepPips step={state.step} total={SEQUENCE.length} complete={complete} /> : null}
      </View>
    </View>
  );
}
