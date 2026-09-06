import { useCallback, useEffect, useMemo, useRef } from 'react';
import { LeafletMap, type LeafletMapHandle } from '@/components/map/LeafletMap';
import { MapView, Marker, NATIVE_MAPS_AVAILABLE } from '@/components/map/nativeMaps';
import { buildLeafletHtml } from '@/lib/leafletHtml';
import { useTheme } from '@/theme';

export type MosqueMapPin = {
  orgNr: string;
  name: string;
  address?: string | null;
  lat: number;
  lon: number;
};

export type MosqueMapProps = {
  pins: MosqueMapPin[];
  center: { lat: number; lon: number };
  actionLabel?: string;
  onSelect: (orgNr: string) => void;
};

export function MosqueMap({ pins, center, actionLabel = 'Vis moské', onSelect }: MosqueMapProps) {
  if (!NATIVE_MAPS_AVAILABLE) {
    return (
      <OsmMosqueMap pins={pins} center={center} actionLabel={actionLabel} onSelect={onSelect} />
    );
  }
  return <NativeMosqueMap pins={pins} center={center} onSelect={onSelect} />;
}

function NativeMosqueMap({ pins, center, onSelect }: MosqueMapProps) {
  const theme = useTheme();

  return (
    <MapView
      style={{ flex: 1 }}
      initialRegion={{
        latitude: center.lat,
        longitude: center.lon,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      }}
      showsUserLocation>
      {pins.map((pin) => (
        <Marker
          key={pin.orgNr}
          coordinate={{ latitude: pin.lat, longitude: pin.lon }}
          title={pin.name}
          description={pin.address ?? undefined}
          pinColor={theme.colors.primary}
          onCalloutPress={() => onSelect(pin.orgNr)}
        />
      ))}
    </MapView>
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
