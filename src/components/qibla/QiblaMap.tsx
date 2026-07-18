import { useMemo } from 'react';
import { Platform, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui';
import { useTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';
import { greatCirclePoints, KAABA } from '@/lib/geo';

export type QiblaMapProps = {
  lat: number;
  lon: number;
};

export function QiblaMap({ lat, lon }: QiblaMapProps) {
  const theme = useTheme();

  return (
    <View style={{ flex: 1, borderRadius: radius.xl, overflow: 'hidden' }}>
      {Platform.OS === 'android' ? (
        <OsmQiblaMap lat={lat} lon={lon} />
      ) : (
        <NativeQiblaMap lat={lat} lon={lon} />
      )}

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

function NativeQiblaMap({ lat, lon }: QiblaMapProps) {
  const theme = useTheme();

  return (
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
  );
}

function OsmQiblaMap({ lat, lon }: QiblaMapProps) {
  const theme = useTheme();

  const html = useMemo(() => {
    const path = greatCirclePoints(lat, lon, KAABA.lat, KAABA.lon).map((point) => [
      point.lat,
      point.lon,
    ]);

    return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html, body, #map { height: 100%; margin: 0; }
  .kaaba-icon { font-size: 26px; line-height: 1; text-align: center; }
  .user-dot {
    width: 16px; height: 16px; border-radius: 8px;
    background: #1a73e8; border: 3px solid #ffffff;
    box-shadow: 0 1px 4px rgba(0,0,0,0.4);
  }
</style>
</head>
<body>
<div id="map"></div>
<script>
  var map = L.map('map', { zoomControl: false }).setView([${lat}, ${lon}], 13);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  L.polyline(${JSON.stringify(path)}, {
    color: '${theme.colors.primary}',
    weight: 3
  }).addTo(map);

  L.marker([${lat}, ${lon}], {
    icon: L.divIcon({ className: '', html: '<div class="user-dot"></div>', iconSize: [16, 16], iconAnchor: [8, 8] })
  }).addTo(map);

  L.marker([${KAABA.lat}, ${KAABA.lon}], {
    icon: L.divIcon({ className: '', html: '<div class="kaaba-icon">🕋</div>', iconSize: [26, 26], iconAnchor: [13, 13] })
  }).addTo(map).bindPopup('Kaba, Mekka');
</script>
</body>
</html>`;
  }, [lat, lon, theme.colors.primary]);

  return (
    <WebView
      style={{ flex: 1 }}
      source={{ html }}
      originWhitelist={['*']}
      setSupportMultipleWindows={false}
      overScrollMode="never"
    />
  );
}
