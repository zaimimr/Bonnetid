import type { ApiLocation } from '@/api/types';
import { distanceKm } from './geo';

export const NORWAY_COVERAGE_RADIUS_KM = 150;

const NORWAY_BOUNDS = { minLat: 57.5, maxLat: 71.5, minLon: 4, maxLon: 31.5 };
const PROMPT_KEY_PRECISION = 1;

export type TravelSignal = 'home' | 'abroad' | 'unknown';

export type Coords = { lat: number; lon: number };

export function isInsideNorwayBounds(lat: number, lon: number): boolean {
  return (
    lat >= NORWAY_BOUNDS.minLat &&
    lat <= NORWAY_BOUNDS.maxLat &&
    lon >= NORWAY_BOUNDS.minLon &&
    lon <= NORWAY_BOUNDS.maxLon
  );
}

export function distanceToNearestLocation(
  locations: ApiLocation[],
  lat: number,
  lon: number,
): number | null {
  let best: number | null = null;
  for (const location of locations) {
    const distance = distanceKm(lat, lon, Number(location.lat), Number(location.lon));
    if (best == null || distance < best) best = distance;
  }
  return best;
}

export function isCoveredByLocationData(
  locations: ApiLocation[],
  lat: number,
  lon: number,
  radiusKm: number = NORWAY_COVERAGE_RADIUS_KM,
): boolean {
  const nearest = distanceToNearestLocation(locations, lat, lon);
  return nearest != null && nearest <= radiusKm;
}

export type TravelInput = {
  coords: Coords | null;
  locations: ApiLocation[] | undefined;
  deviceOffsetMinutes: number;
  osloOffsetMinutes: number;
};

export function evaluateTravel(input: TravelInput): TravelSignal {
  const offsetsDiffer = input.deviceOffsetMinutes !== input.osloOffsetMinutes;

  if (!input.coords || !input.locations || input.locations.length === 0) {
    return offsetsDiffer ? 'abroad' : 'unknown';
  }

  const { lat, lon } = input.coords;
  const covered =
    isInsideNorwayBounds(lat, lon) && isCoveredByLocationData(input.locations, lat, lon);

  if (!covered) return 'abroad';
  return offsetsDiffer ? 'abroad' : 'home';
}

export function travelPromptKey(coords: Coords | null, deviceOffsetMinutes: number): string {
  if (!coords) return `offset:${deviceOffsetMinutes}`;
  const lat = coords.lat.toFixed(PROMPT_KEY_PRECISION);
  const lon = coords.lon.toFixed(PROMPT_KEY_PRECISION);
  return `${lat},${lon}`;
}
