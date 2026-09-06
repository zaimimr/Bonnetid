import { Pressable, ScrollView, View } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { QiblaAr } from '@/components/qibla/QiblaAr';
import { QiblaCompass } from '@/components/qibla/QiblaCompass';
import { QiblaMap } from '@/components/qibla/QiblaMap';
import { AppText, Card, EmptyState, Screen } from '@/components/ui';
import { useCompassHeading } from '@/hooks/useCompassHeading';
import { useResponsive } from '@/hooks/useResponsive';
import { useUserCoords } from '@/hooks/useUserCoords';
import { formatDistance, distanceKm, KAABA, qiblaBearing } from '@/lib/geo';
import { track } from '@/lib/telemetry';
import { useTheme } from '@/theme';
import { opacity, radius, spacing } from '@/theme/tokens';
import { useIsCalculatedMode } from '@/store/settings';

type QiblaView = 'compass' | 'map' | '3d';

export default function QiblaScreen() {
  const coords = useUserCoords();
  const { heading, permissionDenied } = useCompassHeading();
  const { isLandscape } = useResponsive();
  const calculated = useIsCalculatedMode();
  const [view, setView] = useState<QiblaView>('compass');

  const bearing = qiblaBearing(coords.lat, coords.lon);
  const kaabaDistance = distanceKm(coords.lat, coords.lon, KAABA.lat, KAABA.lon);

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
          <AppText size="sm" tone="textMuted">
            {formatDistance(kaabaDistance)} til Mekka
          </AppText>
        </View>

        <ViewSwitcher
          view={view}
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
            {isLandscape ? (
              <RotateNotice bearing={bearing} />
            ) : (
              <>
                <QiblaCompass heading={heading ?? 0} qiblaBearing={bearing} />
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
          <QiblaMap lat={coords.lat} lon={coords.lon} heading={isLandscape ? null : heading} />
        )}

        {view === '3d' &&
          (isLandscape ? (
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <RotateNotice bearing={bearing} />
            </View>
          ) : (
            <QiblaAr qiblaBearing={bearing} />
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

function ViewSwitcher({ view, onChange }: { view: QiblaView; onChange: (view: QiblaView) => void }) {
  const theme = useTheme();

  const options: { value: QiblaView; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { value: 'compass', label: 'Kompass', icon: 'compass-outline' },
    { value: 'map', label: 'Kart', icon: 'map-outline' },
    { value: '3d', label: 'AR', icon: 'cube-outline' },
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
                backgroundColor: isActive ? theme.colors.surface : 'transparent',
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
