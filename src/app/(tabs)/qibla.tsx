import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { QiblaCompass } from '@/components/qibla/QiblaCompass';
import { AppText, Card, EmptyState, Screen } from '@/components/ui';
import { useCompassHeading } from '@/hooks/useCompassHeading';
import { useUserCoords } from '@/hooks/useUserCoords';
import { formatDistance, distanceKm, KAABA, qiblaBearing } from '@/lib/geo';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';

export default function QiblaScreen() {
  const theme = useTheme();
  const coords = useUserCoords();
  const { heading, permissionDenied } = useCompassHeading();

  const bearing = qiblaBearing(coords.lat, coords.lon);
  const kaabaDistance = distanceKm(coords.lat, coords.lon, KAABA.lat, KAABA.lon);

  return (
    <Screen>
      <View style={{ marginTop: spacing.lg, gap: spacing.xl, flex: 1 }}>
        <AppText size="xxl" weight="bold" heading>
          Qibla
        </AppText>

        {permissionDenied ? (
          <EmptyState
            message="Gi appen tilgang til posisjon for å bruke kompasset"
            icon="compass-outline"
          />
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', gap: spacing.xxl }}>
            <QiblaCompass heading={heading ?? 0} qiblaBearing={bearing} />

            <Card rounded="xl">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <Ionicons name="airplane-outline" size={20} color={theme.colors.primary} />
                <View style={{ flex: 1 }}>
                  <AppText size="sm" tone="textMuted">
                    Avstand til Mekka
                  </AppText>
                  <AppText weight="semibold">{formatDistance(kaabaDistance)}</AppText>
                </View>
                {coords.source === 'settings' && (
                  <AppText size="xs" tone="textMuted">
                    Basert på valgt sted
                  </AppText>
                )}
              </View>
            </Card>
          </View>
        )}
      </View>
    </Screen>
  );
}
