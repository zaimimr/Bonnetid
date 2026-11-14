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
import Svg, { Path } from 'react-native-svg';
import { t } from '@/lib/i18n';
import { AppText } from '@/components/ui';
import { beadsFilled, isFree, ringBeads, ringKind } from '@/lib/tasbih';
import { useTheme } from '@/theme';
import { counterType, radius, spacing } from '@/theme/tokens';
import type { TasbihSession } from './useTasbih';

const MAX_RING = 288;
const ARC_RING = 220;
const ARC_STROKE = 16;

function beadSize(beads: number): number {
  if (beads <= 12) return 22;
  if (beads <= 20) return 17;
  return 13;
}

function Bead({
  index,
  beads,
  size,
  filled,
  current,
  x,
  y,
}: {
  index: number;
  beads: number;
  size: number;
  filled: boolean;
  current: boolean;
  x: number;
  y: number;
}) {
  const theme = useTheme();
  const fill = useSharedValue(filled ? 1 : 0);

  useEffect(() => {
    if (filled) {
      fill.value = withSpring(1, { damping: 14, stiffness: 260, reduceMotion: ReduceMotion.System });
    } else {
      fill.value = withDelay(
        (beads - index) * 14,
        withTiming(0, { duration: 220, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.System }),
      );
    }
  }, [filled, index, beads, fill]);

  const fillStyle = useAnimatedStyle(() => ({
    opacity: fill.value,
    transform: [{ scale: 0.4 + fill.value * 0.6 }],
  }));

  return (
    <View
      style={{
        position: 'absolute',
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
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
            width: size,
            height: size,
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

function arcPath(center: number, r: number, from: number, to: number): string {
  const point = (angle: number) => `${center + Math.cos(angle) * r} ${center + Math.sin(angle) * r}`;
  const large = to - from > Math.PI ? 1 : 0;
  return `M ${point(from)} A ${r} ${r} 0 ${large} 1 ${point(to)}`;
}

function Arcs({ segments, filled }: { segments: number; filled: number }) {
  const theme = useTheme();
  const center = ARC_RING / 2;
  const r = center - ARC_STROKE / 2;
  const gap = 0.32;
  const sweep = (Math.PI * 2) / segments;

  return (
    <Svg width={ARC_RING} height={ARC_RING} style={{ position: 'absolute' }}>
      {Array.from({ length: segments }, (_, index) => {
        const from = -Math.PI / 2 + index * sweep + gap / 2;
        return (
          <Path
            key={index}
            d={arcPath(center, r, from, from + sweep - gap)}
            stroke={index < filled ? theme.colors.primary : theme.colors.border}
            strokeWidth={ARC_STROKE}
            strokeLinecap="round"
            fill="none"
          />
        );
      })}
    </Svg>
  );
}

function Center({ count, target }: { count: number; target: number | null }) {
  return (
    <>
      <PulseCount count={count} />
      <AppText size="sm" tone="textMuted" tabular>
        {target ? t('tasbih.of', { target }) : t('tasbih.noGoal').toLocaleLowerCase()}
      </AppText>
    </>
  );
}

function OnceChip() {
  const theme = useTheme();
  return (
    <View
      style={{
        alignSelf: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: radius.full,
        backgroundColor: theme.colors.primarySoft,
      }}>
      <AppText size="sm" weight="semibold" color={theme.colors.onPrimarySoft}>
        {t('tasbih.once')}
      </AppText>
    </View>
  );
}

export function TasbihRing({ session }: { session: TasbihSession }) {
  const { width } = useWindowDimensions();
  const { state, target, total } = session;
  const [fit, setFit] = useState<number | null>(null);
  const kind = ringKind(target);
  const beads = ringBeads(target);
  const bead = beadSize(beads);
  const size = kind === 'arcs' ? ARC_RING : Math.min(width - spacing.xxxl * 2, MAX_RING);
  const ringRadius = size / 2 - bead;
  const filled = beadsFilled(state, target);
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

  if (kind === 'once') {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <OnceChip />
      </View>
    );
  }

  return (
    <View
      onLayout={(event) => {
        const { width: w, height: h } = event.nativeEvent.layout;
        setFit(Math.min(w, h));
      }}
      style={{ flex: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', gap: spacing.sm }}>
      <Animated.View
        style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, ringStyle]}>
        {kind === 'arcs' ? (
          <Arcs segments={target ?? 1} filled={state.count} />
        ) : (
          <View style={{ position: 'absolute', width: size, height: size }}>
            {Array.from({ length: beads }, (_, index) => {
              const angle = (index / beads) * Math.PI * 2 - Math.PI / 2;
              return (
                <Bead
                  key={index}
                  index={index}
                  beads={beads}
                  size={bead}
                  filled={index < filled}
                  current={index === filled}
                  x={size / 2 + Math.cos(angle) * ringRadius}
                  y={size / 2 + Math.sin(angle) * ringRadius}
                />
              );
            })}
          </View>
        )}
        <Center count={state.count} target={target} />
      </Animated.View>
      {isFree(state) ? (
        <AppText size="sm" tone="textMuted" tabular align="center">
          {t('tasbih.total', { count: total })}
        </AppText>
      ) : null}
    </View>
  );
}
