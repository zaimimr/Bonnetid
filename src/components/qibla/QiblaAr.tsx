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
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Line, Polygon, Polyline } from 'react-native-svg';
import { t } from '@/lib/i18n';
import { AppText, Button, EmptyState } from '@/components/ui';
import { useArPose } from '@/hooks/useArPose';
import { buildArScene, type ArScene, type Viewport } from '@/lib/arProjection';
import { isBearingTrustworthy, isQiblaAligned } from '@/lib/geo';
import { palette, radius, spacing } from '@/theme/tokens';

const AR_INK = palette.neutral0;
const AR_SCRIM = 'rgba(0, 0, 0, 0.55)';
const AR_GUIDE = palette.gold400;
const AR_ALIGNED = palette.emerald400;
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
  const aligned = pose ? isQiblaAligned(pose.heading, qiblaBearing, uncertaintyDegrees) : false;
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
          message={t({
            nb: 'Gi appen tilgang til kameraet for å se retningen mot Qibla i AR',
            en: 'Allow camera access to see the Qibla direction in AR',
            ar: 'اسمح للتطبيق باستخدام الكاميرا لرؤية اتجاه القبلة بالواقع المعزز',
            ur: 'AR میں قبلہ کی سمت دیکھنے کے لیے ایپ کو کیمرے تک رسائی دیں',
          })}
          icon="camera-outline"
        />
        {cameraPermission.canAskAgain && (
          <Button
            label={t({
              nb: 'Gi kameratilgang',
              en: 'Allow camera access',
              ar: 'السماح باستخدام الكاميرا',
              ur: 'کیمرے تک رسائی دیں',
            })}
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
        message={t({
          nb: 'Gi appen tilgang til posisjon for å bruke kompasset',
          en: 'Allow location access to use the compass',
          ar: 'اسمح للتطبيق بالوصول إلى موقعك لاستخدام البوصلة',
          ur: 'قطب نما استعمال کرنے کے لیے ایپ کو مقام تک رسائی دیں',
        })}
        icon="compass-outline"
      />
    );
  }

  if (motionUnavailable) {
    return (
      <EmptyState
        message={t({
          nb: 'Enheten mangler bevegelsessensorene som trengs for AR-visning',
          en: 'This device lacks the motion sensors needed for AR view',
          ar: 'يفتقر الجهاز إلى مستشعرات الحركة اللازمة لعرض الواقع المعزز',
          ur: 'اس آلے میں AR منظر کے لیے درکار حرکت کے سینسر موجود نہیں',
        })}
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
              {t({
                nb: 'Venter på kompass og sensorer …',
                en: 'Waiting for compass and sensors …',
                ar: 'في انتظار البوصلة والمستشعرات …',
                ur: 'قطب نما اور سینسرز کا انتظار …',
              })}
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
      ? t({
          nb: 'Løft telefonen mot horisonten',
          en: 'Raise the phone towards the horizon',
          ar: 'ارفع الهاتف نحو الأفق',
          ur: 'فون کو افق کی طرف اٹھائیں',
        })
      : scene.pitchHint === 'lower'
        ? t({
            nb: 'Senk telefonen mot horisonten',
            en: 'Lower the phone towards the horizon',
            ar: 'اخفض الهاتف نحو الأفق',
            ur: 'فون کو افق کی طرف نیچے کریں',
          })
        : Math.abs(scene.deltaDeg) <= 5
          ? null
          : scene.deltaDeg > 0
            ? t({
                nb: `Roter ${Math.round(Math.abs(scene.deltaDeg))}° mot høyre`,
                en: `Turn ${Math.round(Math.abs(scene.deltaDeg))}° to the right`,
                ar: `استدر ${Math.round(Math.abs(scene.deltaDeg))}° إلى اليمين`,
                ur: `${Math.round(Math.abs(scene.deltaDeg))}° دائیں مڑیں`,
              })
            : t({
                nb: `Roter ${Math.round(Math.abs(scene.deltaDeg))}° mot venstre`,
                en: `Turn ${Math.round(Math.abs(scene.deltaDeg))}° to the left`,
                ar: `استدر ${Math.round(Math.abs(scene.deltaDeg))}° إلى اليسار`,
                ur: `${Math.round(Math.abs(scene.deltaDeg))}° بائیں مڑیں`,
              });

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
          <AppText size="xs" weight="semibold" color={AR_INK} style={AR_TEXT_SHADOW}>
            {t({ nb: 'Bønneteppe', en: 'Prayer mat', ar: 'سجادة الصلاة', ur: 'جائے نماز' })}
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
          {aligned && <Ionicons name="checkmark-circle" size={18} color={AR_ALIGNED} />}
          <AppText
            size="sm"
            weight="semibold"
            color={aligned ? AR_ALIGNED : AR_INK}
            style={{ flexShrink: 1 }}>
            {aligned
              ? trustworthy
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
                  })
              : (rotationHint ??
                t({ nb: 'Nesten der …', en: 'Almost there …', ar: 'اقتربت …', ur: 'بس تھوڑا سا اور …' }))}
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
              {t({
                nb: `Usikker posisjon – retningen kan være ±${Math.round(uncertaintyDegrees)}° feil`,
                en: `Uncertain location – the direction may be off by ±${Math.round(uncertaintyDegrees)}°`,
                ar: `موقع غير دقيق – قد يخطئ الاتجاه بمقدار ±${Math.round(uncertaintyDegrees)}°`,
                ur: `غیر یقینی مقام – سمت میں ±${Math.round(uncertaintyDegrees)}° کی غلطی ہو سکتی ہے`,
              })}
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
              {t({
                nb: 'Unøyaktig kompass – beveg telefonen i et åttetall',
                en: 'Inaccurate compass – move the phone in a figure eight',
                ar: 'البوصلة غير دقيقة – حرّك الهاتف على شكل الرقم 8',
                ur: 'قطب نما درست نہیں – فون کو 8 کی شکل میں گھمائیں',
              })}
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
        <Ionicons name="sync-outline" size={20} color={AR_INK} />
        <Animated.View style={phoneStyle}>
          <Ionicons name="phone-portrait-outline" size={30} color={AR_INK} />
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
          {t({
            nb: 'Hold telefonen loddrett og snu deg til du peker mot pilen',
            en: 'Hold the phone upright and turn until you face the arrow',
            ar: 'أمسك الهاتف عموديًا واستدر حتى تتجه نحو السهم',
            ur: 'فون کو سیدھا کھڑا رکھیں اور تیر کی طرف رخ ہونے تک مڑیں',
          })}
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
        <Ionicons name="sync-outline" size={40} color={AR_INK} />
        <Animated.View style={phoneStyle}>
          <Ionicons name="phone-portrait-outline" size={96} color={AR_INK} />
        </Animated.View>
        <Ionicons name="sync-outline" size={40} color={AR_INK} />
      </View>
      <View style={{ alignItems: 'center', gap: spacing.sm }}>
        <AppText size="xl" weight="bold" color={AR_INK} align="center" style={AR_TEXT_SHADOW}>
          {t({
            nb: 'Snu deg rundt for å finne Qibla',
            en: 'Turn around to find the Qibla',
            ar: 'استدر لتجد القبلة',
            ur: 'قبلہ تلاش کرنے کے لیے گھومیں',
          })}
        </AppText>
        <AppText size="sm" color={AR_INK} align="center" style={AR_TEXT_SHADOW}>
          {t({
            nb: 'Hold telefonen loddrett og pek kameraet framover mens du snur deg',
            en: 'Hold the phone upright and point the camera ahead as you turn',
            ar: 'أمسك الهاتف عموديًا ووجّه الكاميرا إلى الأمام أثناء استدارتك',
            ur: 'فون کو سیدھا رکھیں اور گھومتے وقت کیمرا سامنے کی طرف رکھیں',
          })}
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
        <Ionicons name="arrow-up" size={20} color={AR_INK} />
        <Animated.View style={phoneStyle}>
          <Ionicons name="phone-portrait-outline" size={30} color={AR_INK} />
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
          {t({
            nb: 'Reis telefonen opp – hold den loddrett',
            en: 'Raise the phone – hold it upright',
            ar: 'ارفع الهاتف – وأمسكه عموديًا',
            ur: 'فون اوپر اٹھائیں – اسے سیدھا رکھیں',
          })}
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
      <Ionicons
        name={side === 'left' ? 'chevron-back' : 'chevron-forward'}
        size={44}
        color={AR_INK}
      />
    </Animated.View>
  );
}
