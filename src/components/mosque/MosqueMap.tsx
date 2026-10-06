import { useCallback, useEffect, useMemo, useRef, useState, type ElementRef } from 'react';
import { View } from 'react-native';
import { t } from '@/lib/i18n';
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
const CLEAR_MESSAGE = 'clear';
const FIT_PADDING = { top: 64, right: 48, bottom: 200, left: 48 };
const VIEW_MOSQUE = t({ nb: 'Vis moské', en: 'View mosque', ar: 'عرض المسجد', ur: 'مسجد دیکھیں' });

function NativeMosqueMap({
  pins,
  center,
  actionLabel = VIEW_MOSQUE,
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
              {mine && <Badge label={t({ nb: 'Din moské', en: 'Your mosque', ar: 'مسجدك', ur: 'آپ کی مسجد' })} variant="accent" />}
              {pin.distanceKm != null && (
                <Badge label={formatDistance(pin.distanceKm)} variant="neutral" />
              )}
            </View>
          )}
        </View>
        <IconButton name="close" accessibilityLabel={t({ nb: 'Lukk', en: 'Close', ar: 'إغلاق', ur: 'بند کریں' })} onPress={onClose} />
      </View>
      <Button label={actionLabel} onPress={onSelect} fullWidth style={{ marginTop: spacing.md }} />
    </Card>
  );
}

function OsmMosqueMap({
  pins,
  center,
  actionLabel = VIEW_MOSQUE,
  myOrgNr,
  fitToPins,
  onSelect,
}: MosqueMapProps) {
  const theme = useTheme();
  const mapRef = useRef<LeafletMapHandle>(null);
  const [activeOrgNr, setActiveOrgNr] = useState<string | null>(null);
  const active = pins.find((pin) => pin.orgNr === activeOrgNr) ?? null;

  const html = useMemo(
    () =>
      buildLeafletHtml({
        background: theme.colors.surfaceSunken,
        scheme: theme.scheme,
        attribution: { background: theme.colors.surface, text: theme.colors.textMuted },
        styles: `
  .pin {
    box-sizing: border-box; border-radius: 50%;
    background: ${theme.colors.primary}; border: 3px solid ${theme.colors.mapPinRing};
    box-shadow: 0 1px 2px rgba(0,0,0,0.3);
    width: ${PIN_SIZE}px; height: ${PIN_SIZE}px;
  }
  .pin.mine { background: ${theme.colors.accent}; }
  .pin.active { width: ${PIN_SIZE_ACTIVE}px; height: ${PIN_SIZE_ACTIVE}px; border-width: 4px; }`,
        script: `
  var map = createMap(${center.lat}, ${center.lon}, 12);
  var pinLayer = L.layerGroup().addTo(map);
  var fitted = false;

  map.on('click', function () {
    window.ReactNativeWebView.postMessage('${CLEAR_MESSAGE}');
  });

  function pinIcon(className) {
    var size = className.indexOf('active') >= 0 ? ${PIN_SIZE_ACTIVE + 8} : ${PIN_SIZE + 8};
    return L.divIcon({
      className: '',
      html: '<div class="' + className + '"></div>',
      iconSize: [size, size],
      iconAnchor: [size / 2 - 4, size / 2 - 4]
    });
  }

  window.setPins = function (pins, activeOrgNr, myOrgNr, fit) {
    pinLayer.clearLayers();
    pins.forEach(function (pin) {
      var className = 'pin' + (pin.orgNr === myOrgNr ? ' mine' : '') + (pin.orgNr === activeOrgNr ? ' active' : '');
      L.marker([pin.lat, pin.lon], {
        icon: pinIcon(className),
        zIndexOffset: pin.orgNr === activeOrgNr ? 1000 : pin.orgNr === myOrgNr ? 500 : 0
      })
        .on('click', function (event) {
          L.DomEvent.stopPropagation(event);
          window.ReactNativeWebView.postMessage(pin.orgNr);
        })
        .addTo(pinLayer);
    });
    if (fit && !fitted && pins.length > 1) {
      fitted = true;
      map.fitBounds(pins.map(function (pin) { return [pin.lat, pin.lon]; }), {
        paddingTopLeft: [32, 48],
        paddingBottomRight: [32, 160]
      });
    }
  };`,
      }),
    [
      center.lat,
      center.lon,
      theme.scheme,
      theme.colors.accent,
      theme.colors.mapPinRing,
      theme.colors.primary,
      theme.colors.surface,
      theme.colors.surfaceSunken,
      theme.colors.textMuted,
    ],
  );

  const pushPins = useCallback(() => {
    mapRef.current?.run(
      `window.setPins && window.setPins(${JSON.stringify(pins)}, ${JSON.stringify(activeOrgNr)}, ${JSON.stringify(myOrgNr ?? null)}, ${fitToPins ? 'true' : 'false'});`,
    );
  }, [pins, activeOrgNr, myOrgNr, fitToPins]);

  useEffect(() => {
    pushPins();
  }, [pushPins]);

  return (
    <View style={{ flex: 1 }}>
      <LeafletMap
        ref={mapRef}
        html={html}
        onReady={pushPins}
        onMessage={(message) => setActiveOrgNr(message === CLEAR_MESSAGE ? null : message)}
        fallbackMessage={t({
          nb: 'Kartet ble avsluttet av systemet. Bruk listevisningen hvis det skjer igjen.',
          en: 'The system closed the map. Use the list view if it happens again.',
          ar: 'أغلق النظام الخريطة. استخدم عرض القائمة إذا تكرر ذلك.',
          ur: 'سسٹم نے نقشہ بند کر دیا۔ اگر دوبارہ ایسا ہو تو فہرست استعمال کریں۔',
        })}
      />
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
