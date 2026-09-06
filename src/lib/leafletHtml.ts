import { LEAFLET_CSS, LEAFLET_JS, LEAFLET_VERSION } from './leaflet.generated';

export { LEAFLET_VERSION };

export const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

export type LeafletHtmlOptions = {
  background: string;
  styles?: string;
  script: string;
};

export function buildLeafletHtml({ background, styles = '', script }: LeafletHtmlOptions): string {
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
${styles}
</style>
</head>
<body>
<div id="map"></div>
<script>${LEAFLET_JS}</script>
<script>
  function createMap(lat, lon, zoom) {
    var map = L.map('map', { zoomControl: false }).setView([lat, lon], zoom);
    L.tileLayer('${TILE_URL}', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
      crossOrigin: true
    }).addTo(map);
    return map;
  }
${script}
</script>
</body>
</html>`;
}
