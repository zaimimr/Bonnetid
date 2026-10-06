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

type QiblaView = 'compass' | 'map' | '3d';

export default function QiblaScreen() {
  const [isFocused, setIsFocused] = useState(true);
  const coords = usePreciseCoords(isFocused);
  const { heading, accuracy: headingAccuracy, permissionDenied } = useCompassHeading();
  const lowAndroidAccuracy =
    Platform.OS === 'android' && headingAccuracy != null && headingAccuracy <= 1;
  const calibrationNote =
    heading == null
      ? 'Venter på kompasset. Beveg telefonen i en åttetallsbevegelse hvis nålen ikke flytter seg.'
      : lowAndroidAccuracy
        ? 'Kompasset er unøyaktig. Beveg telefonen i en åttetallsbevegelse for å kalibrere det.'
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
            Qibla
          </AppText>
          <View style={{ alignItems: 'flex-end' }}>
            <AppText size="sm" tone="textMuted">
              {formatDistance(kaabaDistance)} til Mekka
            </AppText>
            {coords.accuracyM != null && (
              <AppText size="xs" tone="textMuted">
                Posisjon ±{formatAccuracy(coords.accuracyM)}
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
            message="Gi appen tilgang til posisjon for å bruke kompasset"
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
                      ? 'Basert på posisjonen du valgte reisemodus for. Gi posisjonstilgang for mer nøyaktig retning.'
                      : 'Basert på valgt sted. Gi posisjonstilgang for mer nøyaktig retning.'}
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
        Qibla ligger {Math.round(bearing)}° fra nord. Vend enheten til stående for å bruke kompasset.
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
    { value: 'compass', label: 'Kompass', icon: 'compass-outline' },
    { value: 'map', label: 'Kart', icon: 'map-outline' },
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
