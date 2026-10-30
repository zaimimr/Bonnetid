import { useEffect, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import * as Location from 'expo-location';
import { useLocations } from '@/api/queries';
import { deviceOffsetMinutes, osloOffsetMinutes } from '@/lib/time';
import { evaluateTravel, type Coords, type TravelSignal } from '@/lib/travelMode';
import type { PlaceCountry } from '@/store/settings';
import { t } from '@/lib/i18n';

const MIN_REFRESH_INTERVAL_MS = 60_000;
const FOREGROUND_POLL_MS = 2 * 60_000;
const POSITION_TIMEOUT_MS = 20_000;
const LAST_KNOWN_MAX_AGE_MS = 5 * 60_000;
const FALLBACK_PLACE_NAME = t('travel.yourLocation');

type PositionSnapshot = {
  coords: Coords | null;
  accuracyM: number | null;
  permissionDenied: boolean;
  readAt: number;
};

let snapshot: PositionSnapshot = {
  coords: null,
  accuracyM: null,
  permissionDenied: false,
  readAt: 0,
};
let inFlight: Promise<void> | null = null;
let lastAttemptAt = 0;
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

async function positionWithin(
  accuracy: Location.Accuracy,
  askForAccuracy: boolean,
): Promise<Location.LocationObject | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), POSITION_TIMEOUT_MS);
  });
  const position = await Promise.race([
    Location.getCurrentPositionAsync({ accuracy, mayShowUserSettingsDialog: askForAccuracy }).catch(
      () => null,
    ),
    timeout,
  ]);
  clearTimeout(timer);
  return position;
}

export async function currentPosition(askForAccuracy = false): Promise<Location.LocationObject> {
  const position =
    (await positionWithin(Location.Accuracy.Balanced, askForAccuracy)) ??
    (await positionWithin(Location.Accuracy.High, false)) ??
    (await Location.getLastKnownPositionAsync({ maxAge: LAST_KNOWN_MAX_AGE_MS }));
  if (position) return position;
  throw new Error('Location unavailable');
}

async function readPosition(): Promise<PositionSnapshot> {
  const permission = await Location.getForegroundPermissionsAsync();
  if (!permission.granted) {
    return {
      coords: snapshot.coords,
      accuracyM: snapshot.accuracyM,
      permissionDenied: true,
      readAt: Date.now(),
    };
  }
  const position = await currentPosition();
  return {
    coords: { lat: position.coords.latitude, lon: position.coords.longitude },
    accuracyM: position.coords.accuracy,
    permissionDenied: false,
    readAt: Date.now(),
  };
}

export function refreshPosition(force = false): Promise<void> {
  if (inFlight) return inFlight;
  if (!force && Date.now() - lastAttemptAt < MIN_REFRESH_INTERVAL_MS) return Promise.resolve();

  lastAttemptAt = Date.now();
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

export function useSharedPosition(): PositionSnapshot {
  const position = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    refreshPosition();
    const poll = setInterval(() => {
      if (AppState.currentState === 'active') refreshPosition();
    }, FOREGROUND_POLL_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshPosition();
    });
    return () => {
      clearInterval(poll);
      subscription.remove();
    };
  }, []);

  return position;
}

export function useTravelState(): TravelState {
  const { data: locations } = useLocations();
  const position = useSharedPosition();

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

export async function requestCoords(askForAccuracy = false): Promise<Coords | null> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) return null;
    const position = await currentPosition(askForAccuracy);
    const coords = { lat: position.coords.latitude, lon: position.coords.longitude };
    publish({
      coords,
      accuracyM: position.coords.accuracy,
      permissionDenied: false,
      readAt: Date.now(),
    });
    return coords;
  } catch {
    return null;
  }
}

