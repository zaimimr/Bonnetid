type NativeMaps = typeof import('react-native-maps');

export const NATIVE_MAPS_AVAILABLE: boolean = false;

function MapUnavailable(): null {
  return null;
}

export const MapView = MapUnavailable as unknown as NativeMaps['default'];
export const Marker = MapUnavailable as unknown as NativeMaps['Marker'];
export const Polygon = MapUnavailable as unknown as NativeMaps['Polygon'];
export const Polyline = MapUnavailable as unknown as NativeMaps['Polyline'];
