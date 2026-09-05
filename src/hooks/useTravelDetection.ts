import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import * as Location from 'expo-location';
import { useLocations } from '@/api/queries';
import { distanceKm } from '@/lib/geo';
import { track } from '@/lib/telemetry';
import { deviceOffsetMinutes, osloOffsetMinutes } from '@/lib/time';
import { evaluateTravel, travelPromptKey, type Coords, type TravelSignal } from '@/lib/travelMode';
import { calculatedLocation, useSettings } from '@/store/settings';

const MIN_REFRESH_INTERVAL_MS = 60_000;
const RESYNC_DISTANCE_KM = 75;
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
  promptKey: string;
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
    promptKey: travelPromptKey(position.coords, device),
    permissionDenied: position.permissionDenied,
  };
}

export type TravelPrompt = {
  visible: boolean;
  state: TravelState;
  dismiss: () => void;
};

export function useTravelPrompt(): TravelPrompt {
  const state = useTravelState();
  const mode = useSettings((current) => current.location)?.mode ?? 'norway';
  const answeredKey = useSettings((current) => current.travelPromptKey);
  const setTravelPromptKey = useSettings((current) => current.setTravelPromptKey);

  const visible = state.signal === 'abroad' && mode === 'norway' && answeredKey !== state.promptKey;

  useEffect(() => {
    if (state.signal === 'home' && answeredKey != null) setTravelPromptKey(null);
  }, [state.signal, answeredKey, setTravelPromptKey]);

  const promptKey = state.promptKey;
  const dismiss = useCallback(() => {
    setTravelPromptKey(promptKey);
  }, [promptKey, setTravelPromptKey]);

  return { visible, state, dismiss };
}

export async function resolvePlaceName(coords: Coords): Promise<string> {
  try {
    const places = await Location.reverseGeocodeAsync({
      latitude: coords.lat,
      longitude: coords.lon,
    });
    const place = places[0];
    const name = place?.city ?? place?.subregion ?? place?.region ?? place?.country;
    return name?.trim() || FALLBACK_PLACE_NAME;
  } catch {
    return FALLBACK_PLACE_NAME;
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

export function useCalculatedLocationSync() {
  const location = useSettings((state) => state.location);
  const setLocation = useSettings((state) => state.setLocation);
  const { signal, coords } = useTravelState();
  const applied = useRef<string | null>(null);

  useEffect(() => {
    if (!location || location.mode !== 'calculated' || !coords) return;
    if (signal === 'home') return;
    if (distanceKm(location.lat, location.lon, coords.lat, coords.lon) < RESYNC_DISTANCE_KM) return;

    const key = travelPromptKey(coords, 0);
    if (applied.current === key) return;
    applied.current = key;

    resolvePlaceName(coords)
      .then((name) => {
        setLocation(calculatedLocation(name, coords.lat, coords.lon));
        track('travel_mode_chosen', { choice: 'moved' });
      })
      .catch(() => {});
  }, [location, coords, signal, setLocation]);
}
