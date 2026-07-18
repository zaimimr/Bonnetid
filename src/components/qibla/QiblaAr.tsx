import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Line, Polygon, Polyline } from 'react-native-svg';
import { AppText, Button, EmptyState } from '@/components/ui';
import { useArPose } from '@/hooks/useArPose';
import { buildArScene, type ArScene, type Viewport } from '@/lib/arProjection';
import { isQiblaAligned } from '@/lib/geo';
import { useTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';

export type QiblaArProps = {
  qiblaBearing: number;
};

export function QiblaAr({ qiblaBearing }: QiblaArProps) {
  const theme = useTheme();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [viewport, setViewport] = useState<Viewport | null>(null);
  const { pose, headingAccuracy, permissionDenied, motionUnavailable } = useArPose(
    cameraPermission?.granted ?? false,
  );

  const aligned = pose ? isQiblaAligned(pose.heading, qiblaBearing) : false;
  const wasAligned = useRef(false);

  useEffect(() => {
    if (aligned && !wasAligned.current) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    wasAligned.current = aligned;
  }, [aligned]);

  if (!cameraPermission) {
    return null;
  }

  if (!cameraPermission.granted) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.lg }}>
        <EmptyState
          message="Gi appen tilgang til kameraet for å se retningen mot Qibla i AR"
          icon="camera-outline"
        />
        {cameraPermission.canAskAgain && (
          <Button label="Gi kameratilgang" onPress={() => requestCameraPermission()} />
        )}
      </View>
    );
  }

  if (permissionDenied) {
    return (
      <EmptyState
        message="Gi appen tilgang til posisjon for å bruke kompasset"
        icon="compass-outline"
      />
    );
  }

  if (motionUnavailable) {
    return (
      <EmptyState
        message="Enheten mangler bevegelsessensorene som trengs for AR-visning"
        icon="hardware-chip-outline"
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
          headingAccuracy={headingAccuracy}
        />
      )}

      {!scene && (
        <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
          <View
            style={{
              backgroundColor: theme.colors.overlay,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
              borderRadius: radius.full,
            }}>
            <AppText size="sm" color={theme.colors.textInverse}>
              Venter på kompass og sensorer …
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
  headingAccuracy,
}: {
  scene: ArScene;
  viewport: Viewport;
  aligned: boolean;
  headingAccuracy: number | null;
}) {
  const theme = useTheme();
  const guideColor = aligned ? theme.colors.success : theme.colors.accent;

  const rotationHint =
    scene.pitchHint === 'raise'
      ? 'Løft telefonen mot horisonten'
      : scene.pitchHint === 'lower'
        ? 'Senk telefonen mot horisonten'
        : Math.abs(scene.deltaDeg) <= 5
          ? null
          : scene.deltaDeg > 0
            ? `Roter ${Math.round(Math.abs(scene.deltaDeg))}° mot høyre`
            : `Roter ${Math.round(Math.abs(scene.deltaDeg))}° mot venstre`;

  const compassPoor = headingAccuracy != null && headingAccuracy >= 0 && headingAccuracy <= 1;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
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
          <Ionicons name="cube" size={24} color={guideColor} />
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
          <AppText size="xs" weight="semibold" color={theme.colors.textInverse}>
            Bønneteppe
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
            backgroundColor: theme.colors.overlay,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            borderRadius: radius.full,
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
          }}>
          {aligned && <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} />}
          <AppText
            size="sm"
            weight="semibold"
            color={aligned ? theme.colors.success : theme.colors.textInverse}>
            {aligned ? 'Du peker mot Qibla' : (rotationHint ?? 'Nesten der …')}
          </AppText>
        </View>

        {compassPoor && (
          <View
            style={{
              backgroundColor: theme.colors.overlay,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm,
              borderRadius: radius.full,
            }}>
            <AppText size="xs" color={theme.colors.textInverse}>
              Unøyaktig kompass – beveg telefonen i et åttetall
            </AppText>
          </View>
        )}
      </View>
    </View>
  );
}

function EdgeArrow({ side, viewport }: { side: 'left' | 'right'; viewport: Viewport }) {
  const theme = useTheme();
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
          backgroundColor: theme.colors.overlay,
          borderRadius: radius.full,
          padding: spacing.sm,
        },
        animatedStyle,
      ]}>
      <Ionicons
        name={side === 'left' ? 'chevron-back' : 'chevron-forward'}
        size={44}
        color={theme.colors.textInverse}
      />
    </Animated.View>
  );
}
