import { useEffect, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import * as Location from 'expo-location';
import { useLocations } from '@/api/queries';
import { deviceOffsetMinutes, osloOffsetMinutes } from '@/lib/time';
import { evaluateTravel, type Coords, type TravelSignal } from '@/lib/travelMode';
import type { PlaceCountry } from '@/store/settings';

const MIN_REFRESH_INTERVAL_MS = 60_000;
const FALLBACK_PLACE_NAME = 'Din posisjon';

type PositionSnapshot = {
  coords: Coords | null;
  permissionDenied: boolean;
  readAt: number;
};

let snapshot: PositionSnapshot = { coords: null, permissionDenied: false, readAt: 0 };
let inFlight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function publish(next: PositionSnapshot) {
  snapshot = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): PositionSnapshot {
  return snapshot;
}

async function readPosition(): Promise<PositionSnapshot> {
  const permission = await Location.getForegroundPermissionsAsync();
  if (!permission.granted) {
    return { coords: snapshot.coords, permissionDenied: true, readAt: Date.now() };
  }
  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  return {
    coords: { lat: position.coords.latitude, lon: position.coords.longitude },
    permissionDenied: false,
    readAt: Date.now(),
  };
}

function refreshPosition(): Promise<void> {
  if (inFlight) return inFlight;
  if (Date.now() - snapshot.readAt < MIN_REFRESH_INTERVAL_MS) return Promise.resolve();

  inFlight = readPosition()
    .then(publish)
    .catch(() => {})
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

export type TravelState = {
  signal: TravelSignal;
  coords: Coords | null;
  permissionDenied: boolean;
};

export function useTravelState(): TravelState {
  const { data: locations } = useLocations();
  const position = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    refreshPosition();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshPosition();
    });
    return () => subscription.remove();
  }, []);

  const now = new Date();
  const device = deviceOffsetMinutes(now);
  const signal = evaluateTravel({
    coords: position.coords,
    locations,
    deviceOffsetMinutes: device,
    osloOffsetMinutes: osloOffsetMinutes(now),
  });

  return {
    signal,
    coords: position.coords,
    permissionDenied: position.permissionDenied,
  };
}

export type ResolvedPlace = PlaceCountry & { name: string };

const UNKNOWN_PLACE: ResolvedPlace = {
  name: FALLBACK_PLACE_NAME,
  countryCode: null,
  country: null,
};

export async function resolvePlace(coords: Coords): Promise<ResolvedPlace> {
  try {
    const places = await Location.reverseGeocodeAsync({
      latitude: coords.lat,
      longitude: coords.lon,
    });
    const place = places[0];
    const name = place?.city ?? place?.subregion ?? place?.region ?? place?.country;
    return {
      name: name?.trim() || FALLBACK_PLACE_NAME,
      countryCode: place?.isoCountryCode?.trim().toUpperCase() || null,
      country: place?.country?.trim() || null,
    };
  } catch {
    return UNKNOWN_PLACE;
  }
}

export async function requestCoords(): Promise<Coords | null> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) return null;
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const coords = { lat: position.coords.latitude, lon: position.coords.longitude };
    publish({ coords, permissionDenied: false, readAt: Date.now() });
    return coords;
  } catch {
    return null;
  }
}

