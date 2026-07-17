import { View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui';
import { useTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';
import { KAABA } from '@/lib/geo';

export type QiblaMapProps = {
  lat: number;
  lon: number;
};

export function QiblaMap({ lat, lon }: QiblaMapProps) {
  const theme = useTheme();

  return (
    <View style={{ flex: 1, borderRadius: radius.xl, overflow: 'hidden' }}>
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: lat,
          longitude: lon,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
        showsCompass>
        <Polyline
          coordinates={[
            { latitude: lat, longitude: lon },
            { latitude: KAABA.lat, longitude: KAABA.lon },
          ]}
          geodesic
          strokeColor={theme.colors.primary}
          strokeWidth={3}
        />
        <Marker
          coordinate={{ latitude: KAABA.lat, longitude: KAABA.lon }}
          title="Kaba"
          description="Mekka, Saudi-Arabia"
          pinColor={theme.colors.primary}
        />
      </MapView>

      <View
        style={{
          position: 'absolute',
          bottom: spacing.md,
          left: spacing.md,
          right: spacing.md,
          backgroundColor: theme.colors.surface,
          borderRadius: radius.md,
          padding: spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}>
        <Ionicons name="information-circle-outline" size={18} color={theme.colors.primary} />
        <AppText size="sm" tone="textSecondary" style={{ flex: 1 }}>
          Den grønne linjen peker mot Kaba. Bruk landemerker rundt deg til å orientere deg.
        </AppText>
      </View>
    </View>
  );
}
