import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Platform } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { WebView } from 'react-native-webview';
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
  onSelect: (orgNr: string) => void;
};

export function MosqueMap({ pins, center, onSelect }: MosqueMapProps) {
  if (Platform.OS === 'android') {
    return <OsmMosqueMap pins={pins} center={center} onSelect={onSelect} />;
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

function OsmMosqueMap({ pins, center, onSelect }: MosqueMapProps) {
  const theme = useTheme();
  const webViewRef = useRef<WebView>(null);

  const html = useMemo(
    () => `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html, body, #map { height: 100%; margin: 0; }
  .pin {
    width: 18px; height: 18px; border-radius: 9px;
    background: ${theme.colors.primary}; border: 3px solid #ffffff;
    box-shadow: 0 1px 4px rgba(0,0,0,0.4);
  }
  .popup-name { font: 600 15px -apple-system, system-ui, sans-serif; margin-bottom: 2px; }
  .popup-address { font: 400 13px -apple-system, system-ui, sans-serif; color: #5F6E67; }
  .popup-open {
    display: inline-block; margin-top: 8px; padding: 6px 12px; border-radius: 999px;
    background: ${theme.colors.primary}; color: #ffffff; border: 0;
    font: 600 13px -apple-system, system-ui, sans-serif;
  }
</style>
</head>
<body>
<div id="map"></div>
<script>
  var map = L.map('map', { zoomControl: false }).setView([${center.lat}, ${center.lon}], 11);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  var pinLayer = L.layerGroup().addTo(map);

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
    button.textContent = 'Vis moské';
    button.addEventListener('click', function () {
      window.ReactNativeWebView.postMessage(pin.orgNr);
    });
    wrap.appendChild(button);
    return wrap;
  }

  window.setPins = function (pins) {
    pinLayer.clearLayers();
    pins.forEach(function (pin) {
      L.marker([pin.lat, pin.lon], {
        icon: L.divIcon({
          className: '',
          html: '<div class="pin"></div>',
          iconSize: [18, 18],
          iconAnchor: [9, 9]
        })
      })
        .bindPopup(popupContent(pin))
        .addTo(pinLayer);
    });
  };
</script>
</body>
</html>`,
    [center.lat, center.lon, theme.colors.primary],
  );

  const pushPins = useCallback(() => {
    webViewRef.current?.injectJavaScript(
      `window.setPins && window.setPins(${JSON.stringify(pins)}); true;`,
    );
  }, [pins]);

  useEffect(() => {
    pushPins();
  }, [pushPins]);

  return (
    <WebView
      ref={webViewRef}
      style={{ flex: 1 }}
      source={{ html }}
      originWhitelist={['*']}
      setSupportMultipleWindows={false}
      overScrollMode="never"
      onLoadEnd={pushPins}
      onMessage={(event) => {
        const orgNr = event.nativeEvent.data;
        if (orgNr) onSelect(orgNr);
      }}
    />
  );
}
