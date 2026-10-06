import { useEffect, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { t } from '@/lib/i18n';
import { AppText } from '@/components/ui';
import { useResponsive } from '@/hooks/useResponsive';
import {
  formatAccuracy,
  isBearingTrustworthy,
  isQiblaAligned,
  normalizeAngleDelta,
} from '@/lib/geo';
import { useTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';

const MAX_COMPASS_SIZE = 280;
const MIN_COMPASS_SIZE = 160;

function shortestRotation(from: number, to: number): number {
  return from + normalizeAngleDelta(to - from);
}

const CARDINALS = [
  { label: t({ nb: 'N', en: 'N', ar: 'ش', ur: 'N' }), angle: 0 },
  { label: t({ nb: 'Ø', en: 'E', ar: 'ق', ur: 'E' }), angle: 90 },
  { label: t({ nb: 'S', en: 'S', ar: 'ج', ur: 'S' }), angle: 180 },
  { label: t({ nb: 'V', en: 'W', ar: 'غ', ur: 'W' }), angle: 270 },
];

function sectorPath(size: number, centreBearing: number, halfAngle: number): string {
  const centre = size / 2;
  const radius = centre - 6;
  const toPoint = (degrees: number) => {
    const radians = (degrees * Math.PI) / 180;
    return [centre + radius * Math.sin(radians), centre - radius * Math.cos(radians)];
  };
  const [startX, startY] = toPoint(centreBearing - halfAngle);
  const [endX, endY] = toPoint(centreBearing + halfAngle);
  const largeArc = halfAngle * 2 > 180 ? 1 : 0;
  return `M ${centre} ${centre} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY} Z`;
}

function UprightLabel({
  rotation,
  angle,
  children,
}: {
  rotation: SharedValue<number>;
  angle: number;
  children: ReactNode;
}) {
  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-angle - rotation.value}deg` }],
  }));
  return <Animated.View style={[{ marginTop: spacing.sm }, style]}>{children}</Animated.View>;
}

export type QiblaCompassProps = {
  heading: number;
  qiblaBearing: number;
  uncertaintyDegrees?: number;
  accuracyM?: number | null;
};

export function QiblaCompass({
  heading,
  qiblaBearing,
  uncertaintyDegrees = 0,
  accuracyM = null,
}: QiblaCompassProps) {
  const theme = useTheme();
  const { width, height } = useResponsive();
  const roseRotation = useSharedValue(0);

  const compassSize = Math.round(
    Math.max(MIN_COMPASS_SIZE, Math.min(MAX_COMPASS_SIZE, width - spacing.xxl * 2, height * 0.42)),
  );

  const trustworthy = isBearingTrustworthy(uncertaintyDegrees);
  const isAligned = isQiblaAligned(heading, qiblaBearing, uncertaintyDegrees);
  const wedgeHalfAngle = Math.min(uncertaintyDegrees, 89);

  useEffect(() => {
    roseRotation.value = withTiming(shortestRotation(roseRotation.value, -heading), {
      duration: 200,
    });
  }, [heading, roseRotation]);

  const kaabaStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-qiblaBearing - roseRotation.value}deg` }],
  }));

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
          {wedgeHalfAngle > 1 && (
            <Svg
              width={compassSize}
              height={compassSize}
              style={{ position: 'absolute' }}
              pointerEvents="none">
              <Path
                d={sectorPath(compassSize, qiblaBearing, wedgeHalfAngle)}
                fill={theme.colors.primarySoft}
                opacity={0.55}
              />
            </Svg>
          )}

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
              <UprightLabel rotation={roseRotation} angle={cardinal.angle}>
                <AppText
                  size="sm"
                  weight={cardinal.angle === 0 ? 'bold' : 'medium'}
                  tone={cardinal.angle === 0 ? 'danger' : 'textMuted'}>
                  {cardinal.label}
                </AppText>
              </UprightLabel>
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
            <Animated.View
              style={[
                {
                  marginTop: 20,
                  width: 48,
                  height: 48,
                  borderRadius: radius.full,
                  backgroundColor: isAligned ? theme.colors.primary : theme.colors.primarySoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: isAligned ? theme.colors.primary : theme.colors.border,
                },
                kaabaStyle,
              ]}>
              <Ionicons
                name="cube"
                size={22}
                color={isAligned ? theme.colors.onPrimary : theme.colors.onPrimarySoft}
              />
            </Animated.View>
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
        <AppText tone="textMuted">
          {t({
            nb: 'Qibla-retning fra din posisjon',
            en: 'Qibla direction from your location',
            ar: 'اتجاه القبلة من موقعك',
            ur: 'آپ کے مقام سے قبلہ کی سمت',
          })}
        </AppText>
        {!trustworthy && accuracyM != null && (
          <AppText size="sm" tone="notice" align="center">
            {t({
              nb: `Posisjonen er usikker (±${formatAccuracy(accuracyM)}). Retningen kan være opptil ${Math.round(uncertaintyDegrees)}° feil. Gå ut i åpent lende og vent noen sekunder.`,
              en: `Your location is uncertain (±${formatAccuracy(accuracyM)}). The direction may be off by up to ${Math.round(uncertaintyDegrees)}°. Go out into the open and wait a few seconds.`,
              ar: `موقعك غير دقيق (±${formatAccuracy(accuracyM)}). قد يخطئ الاتجاه بما يصل إلى ${Math.round(uncertaintyDegrees)}°. اخرج إلى مكان مفتوح وانتظر بضع ثوانٍ.`,
              ur: `آپ کا مقام غیر یقینی ہے (±${formatAccuracy(accuracyM)})۔ سمت میں ${Math.round(uncertaintyDegrees)}° تک غلطی ہو سکتی ہے۔ کھلی جگہ پر جائیں اور چند سیکنڈ انتظار کریں۔`,
            })}
          </AppText>
        )}
        {isAligned && (
          <AppText weight="semibold" tone="primary">
            {trustworthy
              ? t({
                  nb: 'Du peker mot Qibla',
                  en: 'You are facing the Qibla',
                  ar: 'أنت متجه نحو القبلة',
                  ur: 'آپ کا رخ قبلہ کی طرف ہے',
                })
              : t({
                  nb: 'Du peker innenfor det usikre området',
                  en: 'You are pointing within the uncertain range',
                  ar: 'أنت متجه ضمن النطاق غير المؤكد',
                  ur: 'آپ کا رخ غیر یقینی دائرے کے اندر ہے',
                })}
          </AppText>
        )}
      </View>
    </View>
  );
}
