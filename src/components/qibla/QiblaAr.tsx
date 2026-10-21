import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Icon } from '@/components/icons';
import Svg, { Circle, Line, Polygon, Polyline } from 'react-native-svg';
import { t } from '@/lib/i18n';
import { AppText, Button, EmptyState } from '@/components/ui';
import { useArPose } from '@/hooks/useArPose';
import { buildArScene, type ArScene, type Viewport } from '@/lib/arProjection';
import { isBearingTrustworthy, QIBLA_TURN_STEP_DEGREES } from '@/lib/geo';
import { useQiblaAligned } from '@/hooks/useQiblaAligned';
import { palette, radius, spacing } from '@/theme/tokens';

const AR_INK = palette.neutral0;
const AR_SCRIM = 'rgba(0, 0, 0, 0.55)';
const AR_GUIDE = palette.gold400;
const AR_ALIGNED = palette.emerald400;

const turnStep = (delta: number) =>
  Math.max(
    QIBLA_TURN_STEP_DEGREES,
    Math.round(Math.abs(delta) / QIBLA_TURN_STEP_DEGREES) * QIBLA_TURN_STEP_DEGREES,
  );
const AR_TEXT_SHADOW = {
  textShadowColor: 'rgba(0, 0, 0, 0.75)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 3,
} as const;

export type QiblaArProps = {
  qiblaBearing: number;
  uncertaintyDegrees?: number;
};

export function QiblaAr({ qiblaBearing, uncertaintyDegrees = 0 }: QiblaArProps) {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [viewport, setViewport] = useState<Viewport | null>(null);
  const { pose, headingAccuracy, permissionDenied, motionUnavailable } = useArPose(
    cameraPermission?.granted ?? false,
  );

  const trustworthy = isBearingTrustworthy(uncertaintyDegrees);
  const aligned = useQiblaAligned(pose?.heading ?? null, qiblaBearing, uncertaintyDegrees);
  const wasAligned = useRef(false);
  const granted = cameraPermission?.granted ?? false;
  const [introDone, setIntroDone] = useState(false);

  useEffect(() => {
    if (aligned && !wasAligned.current) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    wasAligned.current = aligned;
  }, [aligned]);

  useEffect(() => {
    if (!granted) return;
    const timer = setTimeout(() => setIntroDone(true), 3000);
    return () => clearTimeout(timer);
  }, [granted]);

  if (!cameraPermission) {
    return null;
  }

  if (!cameraPermission.granted) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.lg }}>
        <EmptyState
          message={t('qibla.allowCameraAccessTo')}
          icon="camera"
        />
        {cameraPermission.canAskAgain && (
          <Button
            label={t('qibla.allowCameraAccess')}
            onPress={() => requestCameraPermission()}
            style={{ alignSelf: 'center' }}
          />
        )}
      </View>
    );
  }

  if (permissionDenied) {
    return (
      <EmptyState
        message={t('qibla.allowLocationAccessTo2')}
        icon="compass"
      />
    );
  }

  if (motionUnavailable) {
    return (
      <EmptyState
        message={t('qibla.thisDeviceLacksThe')}
        icon="cpu"
      />
    );
  }

  const scene = pose && viewport ? buildArScene(pose, qiblaBearing, viewport) : null;

  return (
    <View
      style={{ flex: 1, borderRadius: radius.xl, overflow: 'hidden' }}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setViewport({ width, height });
      }}>
      <CameraView style={StyleSheet.absoluteFill} facing="back" />

      {scene && viewport && (
        <ArOverlay
          scene={scene}
          viewport={viewport}
          aligned={aligned}
          trustworthy={trustworthy}
          uncertaintyDegrees={uncertaintyDegrees}
          headingAccuracy={headingAccuracy}
          hintsVisible={introDone}
        />
      )}

      {!introDone && <IntroCoach />}

      {!scene && (
        <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
          <View
            style={{
              backgroundColor: AR_SCRIM,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
              borderRadius: radius.full,
            }}>
            <AppText size="sm" color={AR_INK}>
              {t('qibla.waitingForCompassAnd')}
            </AppText>
          </View>
        </View>
      )}
    </View>
  );
}

function ArOverlay({
  scene,
  viewport,
  aligned,
  trustworthy,
  uncertaintyDegrees,
  headingAccuracy,
  hintsVisible,
}: {
  scene: ArScene;
  viewport: Viewport;
  aligned: boolean;
  trustworthy: boolean;
  uncertaintyDegrees: number;
  headingAccuracy: number | null;
  hintsVisible: boolean;
}) {
  const guideColor = aligned ? AR_ALIGNED : AR_GUIDE;

  const rotationHint =
    scene.pitchHint === 'raise'
      ? t('qibla.raiseThePhoneTowards')
      : scene.pitchHint === 'lower'
        ? t('qibla.lowerThePhoneTowards')
        : aligned
          ? null
          : scene.deltaDeg > 0
            ? t('qibla.turnToTheRight', { value: turnStep(scene.deltaDeg) })
            : t('qibla.turnToTheLeft', { value: turnStep(scene.deltaDeg) });

  const compassPoor = headingAccuracy != null && headingAccuracy >= 0 && headingAccuracy <= 1;

  return (
    <View style={[StyleSheet.absoluteFill, { direction: 'ltr' }]} pointerEvents="none">
      <Svg width={viewport.width} height={viewport.height}>
        {scene.groundPath.length >= 2 && (
          <Polyline
            points={scene.groundPath.map((point) => `${point.x},${point.y}`).join(' ')}
            stroke={guideColor}
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray="14 10"
            fill="none"
            opacity={0.9}
          />
        )}

        {scene.matCorners && (
          <>
            <Polygon
              points={scene.matCorners.map((point) => `${point.x},${point.y}`).join(' ')}
              fill={guideColor}
              fillOpacity={0.22}
              stroke={guideColor}
              strokeWidth={2.5}
            />
            <Line
              x1={scene.matCorners[2].x}
              y1={scene.matCorners[2].y}
              x2={scene.matCorners[3].x}
              y2={scene.matCorners[3].y}
              stroke={guideColor}
              strokeWidth={5}
            />
          </>
        )}

        {scene.marker && (
          <>
            <Circle
              cx={scene.marker.x}
              cy={scene.marker.y}
              r={34}
              fill={guideColor}
              fillOpacity={0.25}
            />
            <Circle
              cx={scene.marker.x}
              cy={scene.marker.y}
              r={26}
              fill="none"
              stroke={guideColor}
              strokeWidth={2.5}
            />
          </>
        )}
      </Svg>

      {scene.marker && (
        <View
          style={{
            position: 'absolute',
            left: scene.marker.x - 14,
            top: scene.marker.y - 14,
            width: 28,
            height: 28,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Icon name="cube" size={24} color={guideColor} />
        </View>
      )}

      {scene.matCenter && (
        <View
          style={{
            position: 'absolute',
            left: scene.matCenter.x - 60,
            top: scene.matCenter.y - 10,
            width: 120,
            alignItems: 'center',
          }}>
          <AppText size="xs" weight="semibold" color={AR_INK} style={AR_TEXT_SHADOW}>
            {t('qibla.prayerMat')}
          </AppText>
        </View>
      )}

      {scene.markerEdge && <EdgeArrow side={scene.markerEdge} viewport={viewport} />}

      <View
        style={{
          position: 'absolute',
          top: spacing.lg,
          left: 0,
          right: 0,
          alignItems: 'center',
          gap: spacing.sm,
        }}>
        <View
          style={{
            backgroundColor: AR_SCRIM,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            borderRadius: radius.full,
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            maxWidth: '100%',
          }}>
          {aligned && <Icon name="check-circle" size={18} color={AR_ALIGNED} />}
          <AppText
            size="sm"
            weight="semibold"
            color={aligned ? AR_ALIGNED : AR_INK}
            style={{ flexShrink: 1 }}>
            {aligned
              ? trustworthy
                ? t('qibla.youAreFacingThe')
                : t('qibla.youArePointingWithin')
              : (rotationHint ??
                t('qibla.almostThere'))}
          </AppText>
        </View>

        {!trustworthy && (
          <View
            style={{
              backgroundColor: AR_SCRIM,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm,
              borderRadius: radius.full,
            }}>
            <AppText size="xs" color={AR_INK}>
              {t('qibla.uncertainLocationTheDirection', { value: Math.round(uncertaintyDegrees) })}
            </AppText>
          </View>
        )}

        {compassPoor && (
          <View
            style={{
              backgroundColor: AR_SCRIM,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm,
              borderRadius: radius.full,
            }}>
            <AppText size="xs" color={AR_INK}>
              {t('qibla.inaccurateCompassMoveThe')}
            </AppText>
          </View>
        )}
      </View>

      {hintsVisible && !aligned && (
        scene.pitchHint === 'raise' ? <TiltHint /> : <RotateHint />
      )}
    </View>
  );
}

function RotateHint() {
  const spin = useSharedValue(0);

  useEffect(() => {
    spin.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1100 }),
        withTiming(-1, { duration: 1100 }),
      ),
      -1,
      true,
    );
  }, [spin]);

  const phoneStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 500 }, { rotateY: `${spin.value * 32}deg` }],
  }));

  return (
    <View
      style={{
        position: 'absolute',
        bottom: spacing.xxl,
        left: spacing.xl,
        right: spacing.xl,
        alignItems: 'center',
        gap: spacing.sm,
      }}>
      <View
        style={{
          backgroundColor: AR_SCRIM,
          borderRadius: radius.full,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
        }}>
        <Icon name="arrows-clockwise" size={20} color={AR_INK} />
        <Animated.View style={phoneStyle}>
          <Icon name="device-mobile" size={30} color={AR_INK} />
        </Animated.View>
      </View>
      <View
        style={{
          backgroundColor: AR_SCRIM,
          borderRadius: radius.full,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
        }}>
        <AppText size="xs" weight="semibold" color={AR_INK} align="center" style={AR_TEXT_SHADOW}>
          {t('qibla.holdThePhoneUpright')}
        </AppText>
      </View>
    </View>
  );
}

function IntroCoach() {
  const spin = useSharedValue(0);

  useEffect(() => {
    spin.value = withRepeat(
      withSequence(withTiming(1, { duration: 1300 }), withTiming(-1, { duration: 1300 })),
      -1,
      true,
    );
  }, [spin]);

  const phoneStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 700 }, { rotateY: `${spin.value * 45}deg` }],
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(450)}
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: spacing.xxl,
          gap: spacing.xl,
        },
      ]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
        <Icon name="arrows-clockwise" size={40} color={AR_INK} />
        <Animated.View style={phoneStyle}>
          <Icon name="device-mobile" size={96} color={AR_INK} />
        </Animated.View>
        <Icon name="arrows-clockwise" size={40} color={AR_INK} />
      </View>
      <View style={{ alignItems: 'center', gap: spacing.sm }}>
        <AppText size="xl" weight="bold" color={AR_INK} align="center" style={AR_TEXT_SHADOW}>
          {t('qibla.turnAroundToFind')}
        </AppText>
        <AppText size="sm" color={AR_INK} align="center" style={AR_TEXT_SHADOW}>
          {t('qibla.holdThePhoneUpright2')}
        </AppText>
      </View>
    </Animated.View>
  );
}

function TiltHint() {
  const tilt = useSharedValue(0);

  useEffect(() => {
    tilt.value = withRepeat(
      withSequence(withTiming(1, { duration: 900 }), withTiming(0, { duration: 900 })),
      -1,
    );
  }, [tilt]);

  const phoneStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 500 }, { rotateX: `${tilt.value * 55}deg` }],
  }));

  return (
    <View
      style={{
        position: 'absolute',
        bottom: spacing.xxl,
        left: spacing.xl,
        right: spacing.xl,
        alignItems: 'center',
        gap: spacing.sm,
      }}>
      <View
        style={{
          backgroundColor: AR_SCRIM,
          borderRadius: radius.full,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
        }}>
        <Icon name="arrow-up" size={20} color={AR_INK} />
        <Animated.View style={phoneStyle}>
          <Icon name="device-mobile" size={30} color={AR_INK} />
        </Animated.View>
      </View>
      <View
        style={{
          backgroundColor: AR_SCRIM,
          borderRadius: radius.full,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
        }}>
        <AppText size="xs" weight="semibold" color={AR_INK} align="center" style={AR_TEXT_SHADOW}>
          {t('qibla.raiseThePhoneHold')}
        </AppText>
      </View>
    </View>
  );
}

function EdgeArrow({ side, viewport }: { side: 'left' | 'right'; viewport: Viewport }) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1, { duration: 500 }), withTiming(0, { duration: 500 })),
      -1,
    );
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.5 + pulse.value * 0.5,
    transform: [{ translateX: (side === 'left' ? -1 : 1) * pulse.value * 6 }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: viewport.height / 2 - 32,
          [side]: spacing.md,
          backgroundColor: AR_SCRIM,
          borderRadius: radius.full,
          padding: spacing.sm,
        },
        animatedStyle,
      ]}>
      <Icon
        name={side === 'left' ? 'caret-left' : 'caret-right'}
        size={44}
        color={AR_INK}
      />
    </Animated.View>
  );
}
