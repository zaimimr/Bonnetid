import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { fetchKommuneIso } from '@/api/kartverket';
import { useLocations } from '@/api/queries';
import type { ApiLocation } from '@/api/types';
import { nearestLocation } from './useNearestLocation';
import { track, trackError } from '@/lib/telemetry';
import { isCoveredByLocationData, isInsideNorwayBounds } from '@/lib/travelMode';
import { useSettings, type SavedLocation } from '@/store/settings';

export function isInsideNorway(latitude: number, longitude: number): boolean {
  return isInsideNorwayBounds(latitude, longitude);
}

export function toSavedLocation(location: ApiLocation): SavedLocation {
  return {
    iso: location.iso,
    name: location.name,
    lat: location.lat,
    lon: location.lon,
    mode: 'norway',
  };
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
  if (byKommune) return toSavedLocation(byKommune);

  if (!isCoveredByLocationData(locations, latitude, longitude)) return null;
  const nearest = nearestLocation(locations, latitude, longitude);
  return nearest ? toSavedLocation(nearest) : null;
}

export function useAutoLocation() {
  const { data: locations } = useLocations();
  const setLocation = useSettings((state) => state.setLocation);
  const mode = useSettings((state) => state.location)?.mode;
  const onboardingDone = useSettings((state) => state.onboardingDone);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current || !locations) return;
    if (!onboardingDone) return;
    if (mode === 'calculated') return;
    hasRun.current = true;

    detectNearestLocation(locations)
      .then((detected) => {
        if (detected) {
          setLocation(detected);
          track('location_detected', { iso: detected.iso, source: 'auto' });
        }
      })
      .catch((error) => trackError(error, 'auto-location'));
  }, [locations, mode, onboardingDone, setLocation]);
}
