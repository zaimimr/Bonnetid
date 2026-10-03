import { useCallback, useEffect, useMemo, useRef, useState, type ElementRef } from 'react';
import { View } from 'react-native';
import { LeafletMap, type LeafletMapHandle } from '@/components/map/LeafletMap';
import { MapView, Marker, NATIVE_MAPS_AVAILABLE } from '@/components/map/nativeMaps';
import { AppText, Badge, Button, Card, IconButton } from '@/components/ui';
import { formatDistance } from '@/lib/geo';
import { buildLeafletHtml } from '@/lib/leafletHtml';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';

type MapViewHandle = ElementRef<typeof MapView>;

export type MosqueMapPin = {
  orgNr: string;
  name: string;
  address?: string | null;
  lat: number;
  lon: number;
  distanceKm?: number | null;
};

export type MosqueMapProps = {
  pins: MosqueMapPin[];
  center: { lat: number; lon: number };
  actionLabel?: string;
  myOrgNr?: string;
  fitToPins?: boolean;
  onSelect: (orgNr: string) => void;
};

export function MosqueMap(props: MosqueMapProps) {
  if (!NATIVE_MAPS_AVAILABLE) return <OsmMosqueMap {...props} />;
  return <NativeMosqueMap {...props} />;
}

const PIN_SIZE = 16;
const PIN_SIZE_ACTIVE = 24;
const FIT_PADDING = { top: 64, right: 48, bottom: 200, left: 48 };

function NativeMosqueMap({
  pins,
  center,
  actionLabel = 'Vis moské',
  myOrgNr,
  fitToPins,
  onSelect,
}: MosqueMapProps) {
  const theme = useTheme();
  const mapRef = useRef<MapViewHandle>(null);
  const [activeOrgNr, setActiveOrgNr] = useState<string | null>(null);
  const active = pins.find((pin) => pin.orgNr === activeOrgNr) ?? null;

  const fit = () => {
    if (!fitToPins || pins.length < 2) return;
    mapRef.current?.fitToCoordinates(
      pins.map((pin) => ({ latitude: pin.lat, longitude: pin.lon })),
      { edgePadding: FIT_PADDING, animated: false },
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={{
          latitude: center.lat,
          longitude: center.lon,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }}
        onMapReady={fit}
        mapType="mutedStandard"
        pointsOfInterestFilter={['publicTransport', 'parking']}
        showsBuildings={false}
        pitchEnabled={false}
        userInterfaceStyle={theme.scheme}
        showsUserLocation
        onPress={(event) => {
          if (event.nativeEvent.action !== 'marker-press') setActiveOrgNr(null);
        }}>
        {pins.map((pin) => {
          const isActive = pin.orgNr === activeOrgNr;
          const isMine = pin.orgNr === myOrgNr;
          return (
            <Marker
              key={`${pin.orgNr}-${isActive ? 'active' : 'idle'}`}
              coordinate={{ latitude: pin.lat, longitude: pin.lon }}
              anchor={{ x: 0.5, y: 0.5 }}
              zIndex={isActive ? 3 : isMine ? 2 : 1}
              tracksViewChanges={false}
              accessibilityLabel={pin.name}
              onPress={() => setActiveOrgNr(pin.orgNr)}>
              <MosquePin active={isActive} mine={isMine} />
            </Marker>
          );
        })}
      </MapView>

      {active && (
        <MosquePinCard
          pin={active}
          mine={active.orgNr === myOrgNr}
          actionLabel={actionLabel}
          onClose={() => setActiveOrgNr(null)}
          onSelect={() => onSelect(active.orgNr)}
        />
      )}
    </View>
  );
}

function MosquePin({ active, mine }: { active: boolean; mine: boolean }) {
  const theme = useTheme();
  const size = active ? PIN_SIZE_ACTIVE : PIN_SIZE;
  return (
    <View style={{ padding: 4 }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: mine ? theme.colors.accent : theme.colors.primary,
          borderWidth: active ? 4 : 3,
          borderColor: theme.colors.mapPinRing,
          shadowColor: '#000',
          shadowOpacity: 0.3,
          shadowRadius: 2,
          shadowOffset: { width: 0, height: 1 },
        }}
      />
    </View>
  );
}

function MosquePinCard({
  pin,
  mine,
  actionLabel,
  onClose,
  onSelect,
}: {
  pin: MosqueMapPin;
  mine: boolean;
  actionLabel: string;
  onClose: () => void;
  onSelect: () => void;
}) {
  return (
    <Card
      elevated
      style={{ position: 'absolute', left: spacing.md, right: spacing.md, bottom: spacing.lg }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
        <View style={{ flex: 1, gap: spacing.xs }}>
          <AppText size="lg" weight="semibold">
            {pin.name}
          </AppText>
          {pin.address ? (
            <AppText size="sm" tone="textSecondary">
              {pin.address}
            </AppText>
          ) : null}
          {(pin.distanceKm != null || mine) && (
            <View style={{ flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs }}>
              {mine && <Badge label="Din moské" variant="accent" />}
              {pin.distanceKm != null && (
                <Badge label={formatDistance(pin.distanceKm)} variant="neutral" />
              )}
            </View>
          )}
        </View>
        <IconButton name="close" accessibilityLabel="Lukk" onPress={onClose} />
      </View>
      <Button label={actionLabel} onPress={onSelect} fullWidth style={{ marginTop: spacing.md }} />
    </Card>
  );
}

function OsmMosqueMap({ pins, center, actionLabel, onSelect }: MosqueMapProps) {
  const theme = useTheme();
  const mapRef = useRef<LeafletMapHandle>(null);

  const html = useMemo(
    () =>
      buildLeafletHtml({
        background: theme.colors.surfaceSunken,
        styles: `
  .pin {
    width: 18px; height: 18px; border-radius: 50%;
    background: ${theme.colors.primary}; border: 3px solid ${theme.colors.mapPinRing};
    box-shadow: 0 1px 4px rgba(0,0,0,0.4);
  }
  .leaflet-popup-content-wrapper, .leaflet-popup-tip {
    background: ${theme.colors.surface}; color: ${theme.colors.textPrimary};
  }
  .popup-name { font-weight: 600; font-size: 15px; margin-bottom: 2px; }
  .popup-address { font-size: 13px; color: ${theme.colors.textSecondary}; }
  .popup-open {
    display: inline-block; margin-top: 8px; padding: 6px 12px; border-radius: 999px;
    background: ${theme.colors.primary}; color: ${theme.colors.onPrimary}; border: 0;
    font-weight: 600; font-size: 13px;
  }`,
        script: `
  var map = createMap(${center.lat}, ${center.lon}, 11);
  var pinLayer = L.layerGroup().addTo(map);
  var pinIcon = L.divIcon({
    className: '',
    html: '<div class="pin"></div>',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  function popupContent(pin) {
    var wrap = document.createElement('div');
    var name = document.createElement('div');
    name.className = 'popup-name';
    name.textContent = pin.name;
    wrap.appendChild(name);
    if (pin.address) {
      var address = document.createElement('div');
      address.className = 'popup-address';
      address.textContent = pin.address;
      wrap.appendChild(address);
    }
    var button = document.createElement('button');
    button.className = 'popup-open';
    button.textContent = ${JSON.stringify(actionLabel ?? 'Vis moské')};
    button.addEventListener('click', function () {
      window.ReactNativeWebView.postMessage(pin.orgNr);
    });
    wrap.appendChild(button);
    return wrap;
  }

  window.setPins = function (pins) {
    pinLayer.clearLayers();
    pins.forEach(function (pin) {
      L.marker([pin.lat, pin.lon], { icon: pinIcon })
        .bindPopup(function () {
          return popupContent(pin);
        })
        .addTo(pinLayer);
    });
  };`,
      }),
    [
      actionLabel,
      center.lat,
      center.lon,
      theme.colors.mapPinRing,
      theme.colors.onPrimary,
      theme.colors.primary,
      theme.colors.surface,
      theme.colors.surfaceSunken,
      theme.colors.textPrimary,
      theme.colors.textSecondary,
    ],
  );

  const pushPins = useCallback(() => {
    mapRef.current?.run(`window.setPins && window.setPins(${JSON.stringify(pins)});`);
  }, [pins]);

  useEffect(() => {
    pushPins();
  }, [pushPins]);

  return (
    <LeafletMap
      ref={mapRef}
      html={html}
      onReady={pushPins}
      onMessage={onSelect}
      fallbackMessage="Kartet ble avsluttet av systemet. Bruk listevisningen hvis det skjer igjen."
    />
  );
}
