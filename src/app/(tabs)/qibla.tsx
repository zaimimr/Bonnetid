import { Platform, Pressable, ScrollView, View } from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { QiblaAr } from '@/components/qibla/QiblaAr';
import { QiblaCompass } from '@/components/qibla/QiblaCompass';
import { QiblaHaramNotice } from '@/components/qibla/QiblaHaramNotice';
import { QiblaMap } from '@/components/qibla/QiblaMap';
import { AppText, Card, EmptyState, Screen } from '@/components/ui';
import { useCompassHeading } from '@/hooks/useCompassHeading';
import { usePreciseCoords } from '@/hooks/usePreciseCoords';
import { useFeature } from '@/hooks/useFeature';
import { useResponsive } from '@/hooks/useResponsive';
import {
  bearingUncertaintyDegrees,
  distanceKm,
  formatAccuracy,
  formatDistance,
  isInsideHaram,
  KAABA,
  qiblaBearing,
} from '@/lib/geo';
import { track } from '@/lib/telemetry';
import { useTheme } from '@/theme';
import { opacity, radius, spacing } from '@/theme/tokens';
import { useIsCalculatedMode } from '@/store/settings';
import { PostHogMaskView } from 'posthog-react-native';
import { t } from '@/lib/i18n';

type QiblaView = 'compass' | 'map' | '3d';

export default function QiblaScreen() {
  const [isFocused, setIsFocused] = useState(true);
  const coords = usePreciseCoords(isFocused);
  const { heading, accuracy: headingAccuracy, permissionDenied } = useCompassHeading();
  const lowAndroidAccuracy =
    Platform.OS === 'android' && headingAccuracy != null && headingAccuracy <= 1;
  const calibrationNote =
    heading == null
      ? t({
          nb: 'Venter på kompasset. Beveg telefonen i en åttetallsbevegelse hvis nålen ikke flytter seg.',
          en: 'Waiting for the compass. Move your phone in a figure-eight if the needle does not move.',
          ar: 'في انتظار البوصلة. حرّك هاتفك على شكل الرقم 8 إذا لم تتحرك الإبرة.',
          ur: 'کمپاس کا انتظار ہے۔ اگر سوئی نہ ہلے تو فون کو 8 کی شکل میں گھمائیں۔',
        })
      : lowAndroidAccuracy
        ? t({
            nb: 'Kompasset er unøyaktig. Beveg telefonen i en åttetallsbevegelse for å kalibrere det.',
            en: 'The compass is inaccurate. Move your phone in a figure-eight to calibrate it.',
            ar: 'البوصلة غير دقيقة. حرّك هاتفك على شكل الرقم 8 لمعايرتها.',
            ur: 'کمپاس درست نہیں ہے۔ اسے کیلیبریٹ کرنے کے لیے فون کو 8 کی شکل میں گھمائیں۔',
          })
        : null;
  const { isLandscape } = useResponsive();
  const calculated = useIsCalculatedMode();
  const [selectedView, setView] = useState<QiblaView>('compass');
  const arEnabled = useFeature('qibla-ar');
  const view = arEnabled || selectedView !== '3d' ? selectedView : 'compass';

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, []),
  );

  const bearing = qiblaBearing(coords.lat, coords.lon);
  const kaabaDistance = distanceKm(coords.lat, coords.lon, KAABA.lat, KAABA.lon);
  const uncertainty = bearingUncertaintyDegrees(coords.accuracyM, kaabaDistance);
  const insideHaram = coords.source === 'gps' && isInsideHaram(kaabaDistance);

  return (
    <Screen>
      <View style={{ marginTop: spacing.lg, gap: spacing.lg, flex: 1 }}>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            columnGap: spacing.md,
            rowGap: spacing.xxs,
          }}>
          <AppText size="xxl" weight="bold" heading>
            {t({ nb: 'Qibla', en: 'Qibla', ar: 'القبلة', ur: 'قبلہ' })}
          </AppText>
          <View style={{ alignItems: 'flex-end' }}>
            <AppText size="sm" tone="textMuted">
              {t({
                nb: `${formatDistance(kaabaDistance)} til Mekka`,
                en: `${formatDistance(kaabaDistance)} to Makkah`,
                ar: `${formatDistance(kaabaDistance)} إلى مكة`,
                ur: `مکہ تک ${formatDistance(kaabaDistance)}`,
              })}
            </AppText>
            {coords.accuracyM != null && (
              <AppText size="xs" tone="textMuted">
                {t({ nb: 'Posisjon', en: 'Location', ar: 'الموقع', ur: 'مقام' })} ±{formatAccuracy(coords.accuracyM)}
              </AppText>
            )}
          </View>
        </View>

        <ViewSwitcher
          view={view}
          arEnabled={arEnabled}
          onChange={(next) => {
            setView(next);
            track('qibla_view_changed', { view: next });
          }}
        />

        {permissionDenied && view === 'compass' ? (
          <EmptyState
            message={t({
              nb: 'Gi appen tilgang til posisjon for å bruke kompasset',
              en: 'Allow location access to use the compass',
              ar: 'اسمح للتطبيق بالوصول إلى الموقع لاستخدام البوصلة',
              ur: 'کمپاس استعمال کرنے کے لیے ایپ کو مقام تک رسائی دیں',
            })}
            icon="compass-outline"
          />
        ) : null}

        {view === 'compass' && !permissionDenied && (
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
              paddingBottom: spacing.lg,
            }}
            showsVerticalScrollIndicator={false}>
            {insideHaram ? (
              <QiblaHaramNotice distanceKm={kaabaDistance} />
            ) : isLandscape ? (
              <RotateNotice bearing={bearing} />
            ) : (
              <>
                <QiblaCompass
                  heading={heading ?? 0}
                  qiblaBearing={bearing}
                  uncertaintyDegrees={uncertainty}
                  accuracyM={coords.accuracyM}
                />
                {calibrationNote && (
                  <AppText
                    size="sm"
                    tone="notice"
                    align="center"
                    style={{ marginTop: spacing.lg }}>
                    {calibrationNote}
                  </AppText>
                )}
                {coords.source === 'settings' && (
                  <AppText
                    size="xs"
                    tone="textMuted"
                    align="center"
                    style={{ marginTop: spacing.lg }}>
                    {calculated
                      ? t({
                          nb: 'Basert på posisjonen du valgte reisemodus for. Gi posisjonstilgang for mer nøyaktig retning.',
                          en: 'Based on the location you chose travel mode for. Allow location access for a more accurate direction.',
                          ar: 'بناءً على الموقع الذي اخترت له وضع السفر. اسمح بالوصول إلى الموقع لاتجاه أدق.',
                          ur: 'اس مقام کی بنیاد پر جس کے لیے آپ نے سفر موڈ منتخب کیا۔ زیادہ درست سمت کے لیے مقام تک رسائی دیں۔',
                        })
                      : t({
                          nb: 'Basert på valgt sted. Gi posisjonstilgang for mer nøyaktig retning.',
                          en: 'Based on the selected location. Allow location access for a more accurate direction.',
                          ar: 'بناءً على الموقع المحدد. اسمح بالوصول إلى الموقع لاتجاه أدق.',
                          ur: 'منتخب مقام کی بنیاد پر۔ زیادہ درست سمت کے لیے مقام تک رسائی دیں۔',
                        })}
                  </AppText>
                )}
              </>
            )}
          </ScrollView>
        )}

        {view === 'map' && (
          <PostHogMaskView style={{ flex: 1 }}>
            <QiblaMap
              lat={coords.lat}
              lon={coords.lon}
              heading={isLandscape ? null : heading}
              accuracyM={coords.accuracyM}
              distanceToKaabaKm={kaabaDistance}
            />
          </PostHogMaskView>
        )}

        {view === '3d' &&
          (isLandscape ? (
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <RotateNotice bearing={bearing} />
            </View>
          ) : insideHaram ? (
            <QiblaHaramNotice distanceKm={kaabaDistance} />
          ) : (
            <QiblaAr qiblaBearing={bearing} uncertaintyDegrees={uncertainty} />
          ))}
      </View>
    </Screen>
  );
}

function RotateNotice({ bearing }: { bearing: number }) {
  const theme = useTheme();
  return (
    <Card rounded="xl" style={{ alignItems: 'center', gap: spacing.md }}>
      <Ionicons name="phone-portrait-outline" size={32} color={theme.colors.primary} />
      <AppText size="display" weight="bold" heading tabular>
        {Math.round(bearing)}°
      </AppText>
      <AppText tone="textSecondary" align="center">
        {t({
          nb: `Qibla ligger ${Math.round(bearing)}° fra nord. Vend enheten til stående for å bruke kompasset.`,
          en: `The Qibla is ${Math.round(bearing)}° from north. Turn your device to portrait to use the compass.`,
          ar: `تقع القبلة على بُعد ${Math.round(bearing)}° من الشمال. أدر جهازك إلى الوضع العمودي لاستخدام البوصلة.`,
          ur: `قبلہ شمال سے ${Math.round(bearing)}° پر ہے۔ کمپاس استعمال کرنے کے لیے آلے کو عمودی کریں۔`,
        })}
      </AppText>
    </Card>
  );
}

function ViewSwitcher({
  view,
  arEnabled,
  onChange,
}: {
  view: QiblaView;
  arEnabled: boolean;
  onChange: (view: QiblaView) => void;
}) {
  const theme = useTheme();

  const options: { value: QiblaView; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { value: 'compass', label: t({ nb: 'Kompass', en: 'Compass', ar: 'البوصلة', ur: 'کمپاس' }), icon: 'compass-outline' },
    { value: 'map', label: t({ nb: 'Kart', en: 'Map', ar: 'الخريطة', ur: 'نقشہ' }), icon: 'map-outline' },
    ...(arEnabled ? [{ value: '3d' as const, label: 'AR', icon: 'cube-outline' as const }] : []),
  ];

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: theme.colors.surfaceSunken,
        borderRadius: radius.md,
        padding: spacing.xxs,
        gap: spacing.xxs,
      }}>
      {options.map((option) => {
        const isActive = option.value === view;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              {
                flex: 1,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                gap: spacing.xs,
                paddingVertical: spacing.md,
                borderRadius: radius.sm,
                backgroundColor: isActive ? theme.colors.segmentActive : 'transparent',
                borderWidth: isActive ? 1 : 0,
                borderColor: theme.colors.border,
              },
              pressed && { opacity: opacity.pressed },
            ]}>
            <Ionicons
              name={option.icon}
              size={16}
              color={isActive ? theme.colors.primary : theme.colors.textMuted}
            />
            <AppText
              size="sm"
              weight={isActive ? 'semibold' : 'regular'}
              tone={isActive ? 'textPrimary' : 'textMuted'}
              maxFontSizeMultiplier={1.4}
              numberOfLines={1}
              style={{ flexShrink: 1 }}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
