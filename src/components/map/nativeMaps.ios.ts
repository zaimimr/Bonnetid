import MapViewNative, {
  Circle as CircleNative,
  Marker as MarkerNative,
  Polygon as PolygonNative,
  Polyline as PolylineNative,
} from 'react-native-maps';

export const NATIVE_MAPS_AVAILABLE: boolean = true;

export const MapView = MapViewNative;
export const Marker = MarkerNative;
export const Polygon = PolygonNative;
export const Polyline = PolylineNative;
export const Circle = CircleNative;
