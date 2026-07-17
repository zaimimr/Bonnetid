import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui';
import { useTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';

const COMPASS_SIZE = 280;
const ALIGNED_THRESHOLD_DEGREES = 5;

function shortestRotation(from: number, to: number): number {
  let delta = to - from;
  while (delta > 180) delta -= 360;
  while (delta < -180) delta += 360;
  return from + delta;
}

export type QiblaCompassProps = {
  heading: number;
  qiblaBearing: number;
};

export function QiblaCompass({ heading, qiblaBearing }: QiblaCompassProps) {
  const theme = useTheme();
  const rotation = useSharedValue(0);

  const target = qiblaBearing - heading;
  const isAligned = Math.abs(((target % 360) + 540) % 360 - 180) > 180 - ALIGNED_THRESHOLD_DEGREES;

  useEffect(() => {
    rotation.value = withTiming(shortestRotation(rotation.value, target), { duration: 200 });
  }, [target, rotation]);

  const needleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const ringColor = isAligned ? theme.colors.primary : theme.colors.border;

  return (
    <View style={{ alignItems: 'center', gap: spacing.xl }}>
      <View
        style={{
          width: COMPASS_SIZE,
          height: COMPASS_SIZE,
          borderRadius: COMPASS_SIZE / 2,
          borderWidth: 3,
          borderColor: ringColor,
          backgroundColor: theme.colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Animated.View
          style={[
            {
              width: COMPASS_SIZE,
              height: COMPASS_SIZE,
              alignItems: 'center',
              justifyContent: 'flex-start',
              paddingTop: spacing.xl,
            },
            needleStyle,
          ]}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: radius.full,
              backgroundColor: isAligned ? theme.colors.primary : theme.colors.primarySoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Ionicons
              name="navigate"
              size={28}
              color={isAligned ? theme.colors.onPrimary : theme.colors.primary}
            />
          </View>
          <View
            style={{
              flex: 1,
              width: 3,
              backgroundColor: isAligned ? theme.colors.primary : theme.colors.borderStrong,
              marginVertical: spacing.md,
              borderRadius: radius.full,
            }}
          />
        </Animated.View>

        <View
          style={{
            position: 'absolute',
            width: 14,
            height: 14,
            borderRadius: radius.full,
            backgroundColor: theme.colors.accent,
          }}
        />
      </View>

      <View style={{ alignItems: 'center', gap: spacing.xs }}>
        <AppText size="display" weight="bold" heading tabular>
          {Math.round(qiblaBearing)}°
        </AppText>
        <AppText tone="textMuted">Retning mot Kaba fra din posisjon</AppText>
        {isAligned && (
          <AppText weight="semibold" tone="primary">
            Du peker mot Qibla
          </AppText>
        )}
      </View>
    </View>
  );
}
