import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { fetchKommuneIso } from '@/api/kartverket';
import { useLocations } from '@/api/queries';
import type { ApiLocation } from '@/api/types';
import { currentPosition, useSharedPosition } from '@/hooks/useTravelDetection';
import { distanceKm } from '@/lib/geo';
import type { Coords } from '@/lib/travelMode';
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
  askForAccuracy = false,
): Promise<SavedLocation | null> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return null;
  const position = await currentPosition(askForAccuracy);
  return locationAt(locations, position.coords.latitude, position.coords.longitude);
}

export async function locationAt(
  locations: ApiLocation[],
  latitude: number,
  longitude: number,
): Promise<SavedLocation | null> {
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

const REDETECT_DISTANCE_KM = 1;

export function useAutoLocation() {
  const { data: locations } = useLocations();
  const setLocation = useSettings((state) => state.setLocation);
  const mode = useSettings((state) => state.location)?.mode;
  const onboardingDone = useSettings((state) => state.onboardingDone);
  const { coords } = useSharedPosition();
  const detectedAt = useRef<Coords | null>(null);

  useEffect(() => {
    if (!locations || !coords || !onboardingDone || mode === 'calculated') return;
    const last = detectedAt.current;
    if (last && distanceKm(last.lat, last.lon, coords.lat, coords.lon) < REDETECT_DISTANCE_KM) return;
    detectedAt.current = coords;

    locationAt(locations, coords.lat, coords.lon)
      .then((detected) => {
        if (!detected) {
          detectedAt.current = null;
          return;
        }
        if (detected.iso === useSettings.getState().location?.iso) return;
        setLocation(detected);
        track('location_detected', { iso: detected.iso, source: 'auto' });
      })
      .catch((error) => {
        detectedAt.current = null;
        trackError(error, 'auto-location');
      });
  }, [coords, locations, mode, onboardingDone, setLocation]);
}
