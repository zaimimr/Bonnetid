import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { fetchKommuneIso } from '@/api/kartverket';
import { useLocations } from '@/api/queries';
import type { ApiLocation } from '@/api/types';
import { nearestLocation } from './useNearestLocation';
import { useSettings, type SavedLocation } from '@/store/settings';

const NORWAY_BOUNDS = { minLat: 57.5, maxLat: 71.5, minLon: 4, maxLon: 31.5 };

export function isInsideNorway(latitude: number, longitude: number): boolean {
  return (
    latitude >= NORWAY_BOUNDS.minLat &&
    latitude <= NORWAY_BOUNDS.maxLat &&
    longitude >= NORWAY_BOUNDS.minLon &&
    longitude <= NORWAY_BOUNDS.maxLon
  );
}

export async function detectNearestLocation(
  locations: ApiLocation[],
): Promise<SavedLocation | null> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return null;
  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  const { latitude, longitude } = position.coords;
  if (!isInsideNorway(latitude, longitude)) return null;
  const kommuneIso = await fetchKommuneIso(latitude, longitude);
  const byKommune = kommuneIso
    ? (locations.find((location) => location.iso === kommuneIso) ?? null)
    : null;
  const match = byKommune ?? nearestLocation(locations, latitude, longitude);
  return match ? { iso: match.iso, name: match.name, lat: match.lat, lon: match.lon } : null;
}

export function useAutoLocation() {
  const { data: locations } = useLocations();
  const setLocation = useSettings((state) => state.setLocation);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current || !locations) return;
    hasRun.current = true;

    detectNearestLocation(locations)
      .then((detected) => {
        if (detected) setLocation(detected);
      })
      .catch(() => {});
  }, [locations, setLocation]);
}
