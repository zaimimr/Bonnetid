import { useCallback, useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LeafletMap, type LeafletMapHandle } from '@/components/map/LeafletMap';
import {
  Circle,
  MapView,
  Marker,
  NATIVE_MAPS_AVAILABLE,
  Polygon,
  Polyline,
} from '@/components/map/nativeMaps';
import { AppText } from '@/components/ui';
import { useTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';
import { buildLeafletHtml } from '@/lib/leafletHtml';
import { facingConePoints, greatCirclePoints, KAABA } from '@/lib/geo';

export type QiblaMapProps = {
  lat: number;
  lon: number;
  heading?: number | null;
  accuracyM?: number | null;
  distanceToKaabaKm?: number;
};

function leafletZoom(distanceToKaabaKm: number, accuracyM: number | null): number {
  const span = spanKm(distanceToKaabaKm, accuracyM);
  if (span <= 0.3) return 17;
  if (span <= 0.8) return 16;
  if (span <= 2) return 14;
  return 13;
}

function coneLengthKm(distanceToKaabaKm: number): number {
  return Math.max(0.05, Math.min(0.6, distanceToKaabaKm * 0.6));
}

const MAX_SPAN_KM = 5.5;

function spanKm(distanceToKaabaKm: number, accuracyM: number | null): number {
  const fromAccuracy = ((accuracyM ?? 0) * 4) / 1000;
  const fromDistance = Math.min(MAX_SPAN_KM, distanceToKaabaKm * 4);
  return Math.max(0.2, Math.min(MAX_SPAN_KM, Math.max(fromAccuracy, fromDistance)));
}

export function QiblaMap({
  lat,
  lon,
  heading,
  accuracyM = null,
  distanceToKaabaKm = 1000,
}: QiblaMapProps) {
  const theme = useTheme();

  return (
    <View style={{ flex: 1, borderRadius: radius.xl, overflow: 'hidden' }}>
      {NATIVE_MAPS_AVAILABLE ? (
        <NativeQiblaMap
          lat={lat}
          lon={lon}
          heading={heading}
          accuracyM={accuracyM}
          distanceToKaabaKm={distanceToKaabaKm}
        />
      ) : (
        <OsmQiblaMap
          lat={lat}
          lon={lon}
          heading={heading}
          accuracyM={accuracyM}
          distanceToKaabaKm={distanceToKaabaKm}
        />
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
          {heading == null
            ? 'Den grønne linjen peker mot Kaba.'
            : 'Den grønne linjen peker mot Kaba. Snu deg til den blå kjeglen dekker linjen.'}
        </AppText>
      </View>
    </View>
  );
}

function NativeQiblaMap({
  lat,
  lon,
  heading,
  accuracyM = null,
  distanceToKaabaKm = 1000,
}: QiblaMapProps) {
  const theme = useTheme();
  const cone =
    heading != null
      ? facingConePoints(lat, lon, heading, coneLengthKm(distanceToKaabaKm))
      : null;
  const delta = spanKm(distanceToKaabaKm, accuracyM) / 111;

  return (
    <MapView
      style={{ flex: 1 }}
      initialRegion={{
        latitude: lat,
        longitude: lon,
        latitudeDelta: delta,
        longitudeDelta: delta,
      }}
      showsUserLocation
      showsCompass>
      {accuracyM != null && accuracyM > 0 && (
        <Circle
          center={{ latitude: lat, longitude: lon }}
          radius={accuracyM}
          fillColor={theme.colors.mapFacingFill}
          strokeColor={theme.colors.mapFacing}
          strokeWidth={1}
        />
      )}
      <Polyline
        coordinates={[
          { latitude: lat, longitude: lon },
          { latitude: KAABA.lat, longitude: KAABA.lon },
        ]}
        geodesic
        strokeColor={theme.colors.primary}
        strokeWidth={3}
      />
      {cone && (
        <Polygon
          coordinates={cone.map((point) => ({ latitude: point.lat, longitude: point.lon }))}
          fillColor={theme.colors.mapFacingFill}
          strokeColor={theme.colors.mapFacing}
          strokeWidth={1}
        />
      )}
      <Marker
        coordinate={{ latitude: KAABA.lat, longitude: KAABA.lon }}
        title="Kaba"
        description="Mekka, Saudi-Arabia"
        pinColor={theme.colors.primary}
      />
    </MapView>
  );
}

function OsmQiblaMap({
  lat,
  lon,
  heading,
  accuracyM = null,
  distanceToKaabaKm = 1000,
}: QiblaMapProps) {
  const theme = useTheme();
  const mapRef = useRef<LeafletMapHandle>(null);

  const html = useMemo(() => {
    const path = greatCirclePoints(lat, lon, KAABA.lat, KAABA.lon).map((point) => [
      point.lat,
      point.lon,
    ]);

    return buildLeafletHtml({
      background: theme.colors.surfaceSunken,
      styles: `
  .kaaba-icon { font-size: 26px; line-height: 1; text-align: center; }
  .user-dot {
    width: 16px; height: 16px; border-radius: 50%;
    background: ${theme.colors.mapFacing}; border: 3px solid ${theme.colors.mapPinRing};
    box-shadow: 0 1px 4px rgba(0,0,0,0.4);
  }
  .leaflet-popup-content-wrapper, .leaflet-popup-tip {
    background: ${theme.colors.surface}; color: ${theme.colors.textPrimary};
  }`,
      script: `
  var map = createMap(${lat}, ${lon}, ${leafletZoom(distanceToKaabaKm, accuracyM)});

  ${
    accuracyM != null && accuracyM > 0
      ? `L.circle([${lat}, ${lon}], {
    radius: ${accuracyM},
    color: '${theme.colors.mapFacing}',
    weight: 1,
    fillColor: '${theme.colors.mapFacing}',
    fillOpacity: 0.15
  }).addTo(map);`
      : ''
  }

  window.userCone = L.polygon([], {
    color: '${theme.colors.mapFacing}',
    weight: 1,
    fillColor: '${theme.colors.mapFacing}',
    fillOpacity: 0.25
  }).addTo(map);
  window.setCone = function (pts) { window.userCone.setLatLngs(pts); };

  L.polyline(${JSON.stringify(path)}, {
    color: '${theme.colors.primary}',
    weight: 3
  }).addTo(map);

  L.marker([${lat}, ${lon}], {
    icon: L.divIcon({ className: '', html: '<div class="user-dot"></div>', iconSize: [16, 16], iconAnchor: [8, 8] })
  }).addTo(map);

  L.marker([${KAABA.lat}, ${KAABA.lon}], {
    icon: L.divIcon({ className: '', html: '<div class="kaaba-icon">🕋</div>', iconSize: [26, 26], iconAnchor: [13, 13] })
  }).addTo(map).bindPopup('Kaba, Mekka');`,
    });
  }, [
    lat,
    lon,
    accuracyM,
    distanceToKaabaKm,
    theme.colors.mapFacing,
    theme.colors.mapPinRing,
    theme.colors.primary,
    theme.colors.surface,
    theme.colors.surfaceSunken,
    theme.colors.textPrimary,
  ]);

  const pushCone = useCallback(() => {
    if (heading == null) return;
    const cone = facingConePoints(lat, lon, heading, coneLengthKm(distanceToKaabaKm)).map(
      (point) => [point.lat, point.lon],
    );
    mapRef.current?.run(`window.setCone && window.setCone(${JSON.stringify(cone)});`);
  }, [lat, lon, heading, distanceToKaabaKm]);

  useEffect(() => {
    pushCone();
  }, [pushCone]);

  return (
    <LeafletMap
      ref={mapRef}
      html={html}
      onReady={pushCone}
      fallbackMessage="Kartet ble avsluttet av systemet. Kompassvisningen virker fortsatt."
    />
  );
}
