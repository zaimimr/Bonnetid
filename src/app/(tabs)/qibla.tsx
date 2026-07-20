import { Pressable, View } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { QiblaAr } from '@/components/qibla/QiblaAr';
import { QiblaCompass } from '@/components/qibla/QiblaCompass';
import { QiblaMap } from '@/components/qibla/QiblaMap';
import { AppText, EmptyState, Screen } from '@/components/ui';
import { useCompassHeading } from '@/hooks/useCompassHeading';
import { useUserCoords } from '@/hooks/useUserCoords';
import { formatDistance, distanceKm, KAABA, qiblaBearing } from '@/lib/geo';
import { useTheme } from '@/theme';
import { opacity, radius, spacing } from '@/theme/tokens';

type QiblaView = 'compass' | 'map' | '3d';

export default function QiblaScreen() {
  const coords = useUserCoords();
  const { heading, permissionDenied } = useCompassHeading();
  const [view, setView] = useState<QiblaView>('compass');

  const bearing = qiblaBearing(coords.lat, coords.lon);
  const kaabaDistance = distanceKm(coords.lat, coords.lon, KAABA.lat, KAABA.lon);

  return (
    <Screen>
      <View style={{ marginTop: spacing.lg, gap: spacing.lg, flex: 1 }}>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <AppText size="xxl" weight="bold" heading>
            Qibla
          </AppText>
          <AppText size="sm" tone="textMuted">
            {formatDistance(kaabaDistance)} til Mekka
          </AppText>
        </View>

        <ViewSwitcher view={view} onChange={setView} />

        {permissionDenied && view === 'compass' ? (
          <EmptyState
            message="Gi appen tilgang til posisjon for å bruke kompasset"
            icon="compass-outline"
          />
        ) : null}

        {view === 'compass' && !permissionDenied && (
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <QiblaCompass heading={heading ?? 0} qiblaBearing={bearing} />
            {coords.source === 'settings' && (
              <AppText size="xs" tone="textMuted" align="center" style={{ marginTop: spacing.lg }}>
                Basert på valgt sted. Gi posisjonstilgang for mer nøyaktig retning.
              </AppText>
            )}
          </View>
        )}

        {view === 'map' && <QiblaMap lat={coords.lat} lon={coords.lon} heading={heading} />}

        {view === '3d' && <QiblaAr qiblaBearing={bearing} />}
      </View>
    </Screen>
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
              tone={isActive ? 'textPrimary' : 'textMuted'}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
