import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui';
import { useResponsive } from '@/hooks/useResponsive';
import { isQiblaAligned, normalizeAngleDelta } from '@/lib/geo';
import { useTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';

const MAX_COMPASS_SIZE = 280;
const MIN_COMPASS_SIZE = 160;

function shortestRotation(from: number, to: number): number {
  return from + normalizeAngleDelta(to - from);
}

const CARDINALS = [
  { label: 'N', angle: 0 },
  { label: 'Ø', angle: 90 },
  { label: 'S', angle: 180 },
  { label: 'V', angle: 270 },
];

export type QiblaCompassProps = {
  heading: number;
  qiblaBearing: number;
};

export function QiblaCompass({ heading, qiblaBearing }: QiblaCompassProps) {
  const theme = useTheme();
  const { width, height } = useResponsive();
  const roseRotation = useSharedValue(0);

  const compassSize = Math.round(
    Math.max(MIN_COMPASS_SIZE, Math.min(MAX_COMPASS_SIZE, width - spacing.xxl * 2, height * 0.42)),
  );

  const isAligned = isQiblaAligned(heading, qiblaBearing);

  useEffect(() => {
    roseRotation.value = withTiming(shortestRotation(roseRotation.value, -heading), {
      duration: 200,
    });
  }, [heading, roseRotation]);

  const roseStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${roseRotation.value}deg` }],
  }));

  return (
    <View style={{ alignItems: 'center', gap: spacing.xl }}>
      <View style={{ width: compassSize, height: compassSize + 20, alignItems: 'center' }}>
        <Ionicons
          name="caret-down"
          size={26}
          color={isAligned ? theme.colors.primary : theme.colors.textMuted}
          style={{ marginBottom: -8, zIndex: 2 }}
        />
        <Animated.View
          style={[
            {
              width: compassSize,
              height: compassSize,
              borderRadius: compassSize / 2,
              borderWidth: 3,
              borderColor: isAligned ? theme.colors.primary : theme.colors.border,
              backgroundColor: theme.colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
            },
            roseStyle,
          ]}>
          {CARDINALS.map((cardinal) => (
            <View
              key={cardinal.label}
              style={{
                position: 'absolute',
                width: compassSize,
                height: compassSize,
                alignItems: 'center',
                transform: [{ rotate: `${cardinal.angle}deg` }],
              }}>
              <AppText
                size="sm"
                weight={cardinal.label === 'N' ? 'bold' : 'medium'}
                tone={cardinal.label === 'N' ? 'danger' : 'textMuted'}
                style={{ marginTop: spacing.sm }}>
                {cardinal.label}
              </AppText>
            </View>
          ))}

          <View
            style={{
              position: 'absolute',
              width: compassSize,
              height: compassSize,
              alignItems: 'center',
              transform: [{ rotate: `${qiblaBearing}deg` }],
            }}>
            <View
              style={{
                marginTop: 20,
                width: 48,
                height: 48,
                borderRadius: radius.full,
                backgroundColor: isAligned ? theme.colors.primary : theme.colors.primarySoft,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: isAligned ? theme.colors.primary : theme.colors.border,
                transform: [{ rotate: `${-qiblaBearing}deg` }],
              }}>
              <Ionicons
                name="cube"
                size={22}
                color={isAligned ? theme.colors.onPrimary : theme.colors.onPrimarySoft}
              />
            </View>
          </View>

          <View
            style={{
              width: 12,
              height: 12,
              borderRadius: radius.full,
              backgroundColor: theme.colors.borderStrong,
            }}
          />
        </Animated.View>
      </View>

      <View style={{ alignItems: 'center', gap: spacing.xs }}>
        <AppText size="display" weight="bold" heading tabular>
          {Math.round(qiblaBearing)}°
        </AppText>
        <AppText tone="textMuted">Qibla-retning fra din posisjon</AppText>
        {isAligned && (
          <AppText weight="semibold" tone="primary">
            Du peker mot Qibla
          </AppText>
        )}
      </View>
    </View>
  );
}
