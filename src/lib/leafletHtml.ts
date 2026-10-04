import { LEAFLET_CSS, LEAFLET_JS, LEAFLET_VERSION } from './leaflet.generated';

export { LEAFLET_VERSION };

export const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

const MUTED_TILES = {
  light: 'saturate(0.45) brightness(1.03) contrast(0.92)',
  dark: 'invert(1) hue-rotate(180deg) saturate(0.4) brightness(0.82) contrast(0.88)',
};

export type LeafletHtmlOptions = {
  background: string;
  scheme: 'light' | 'dark';
  attribution: { background: string; text: string };
  styles?: string;
  script: string;
};

export function buildLeafletHtml({
  background,
  scheme,
  attribution,
  styles = '',
  script,
}: LeafletHtmlOptions): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<style>${LEAFLET_CSS}</style>
<style>
  html, body, #map { height: 100%; margin: 0; }
  #map { background: ${background}; }
  .leaflet-div-icon { background: transparent; border: 0; }
  .leaflet-container { font: 400 13px -apple-system, system-ui, sans-serif; }
  .leaflet-tile-pane { filter: ${MUTED_TILES[scheme]}; }
  .leaflet-control-attribution {
    background: ${attribution.background} !important; color: ${attribution.text};
    border-radius: 6px 0 0 0; font-size: 10px; padding: 1px 6px;
  }
  .leaflet-control-attribution a { color: ${attribution.text}; }
${styles}
</style>
</head>
<body>
<div id="map"></div>
<script>${LEAFLET_JS}</script>
<script>
  function createMap(lat, lon, zoom) {
    var map = L.map('map', { zoomControl: false, preferCanvas: true }).setView([lat, lon], zoom);
    L.tileLayer('${TILE_URL}', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
      crossOrigin: true,
      updateWhenZooming: false,
      keepBuffer: 4
    }).addTo(map);
    return map;
  }
${script}
</script>
</body>
</html>`;
}
