import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as Location from 'expo-location';
import { useLocations } from '@/api/queries';
import { deviceOffsetMinutes, osloOffsetMinutes } from '@/lib/time';
import { evaluateTravel, travelPromptKey, type Coords, type TravelSignal } from '@/lib/travelMode';
import { useSettings } from '@/store/settings';

export type TravelState = {
  signal: TravelSignal;
  coords: Coords | null;
  promptKey: string;
  permissionDenied: boolean;
};

async function readPosition(): Promise<{ coords: Coords | null; denied: boolean }> {
  const permission = await Location.getForegroundPermissionsAsync();
  if (!permission.granted) return { coords: null, denied: true };
  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  return {
    coords: { lat: position.coords.latitude, lon: position.coords.longitude },
    denied: false,
  };
}

export function useTravelState(): TravelState {
  const { data: locations } = useLocations();
  const [coords, setCoords] = useState<Coords | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const running = useRef(false);

  const refresh = useCallback(() => {
    if (running.current) return;
    running.current = true;
    readPosition()
      .then((result) => {
        setPermissionDenied(result.denied);
        if (result.coords) setCoords(result.coords);
      })
      .catch(() => {})
      .finally(() => {
        running.current = false;
      });
  }, []);

  useEffect(() => {
    refresh();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  const now = new Date();
  const device = deviceOffsetMinutes(now);
  const signal = evaluateTravel({
    coords,
    locations,
    deviceOffsetMinutes: device,
    osloOffsetMinutes: osloOffsetMinutes(now),
  });

  return { signal, coords, promptKey: travelPromptKey(coords, device), permissionDenied };
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

  const abroad = state.signal === 'abroad';
  const visible = abroad && mode === 'norway' && answeredKey !== state.promptKey;

  useEffect(() => {
    if (state.signal === 'home' && answeredKey != null) setTravelPromptKey(null);
  }, [state.signal, answeredKey, setTravelPromptKey]);

  const promptKey = state.promptKey;
  const dismiss = useCallback(() => {
    setTravelPromptKey(promptKey);
  }, [promptKey, setTravelPromptKey]);

  return { visible, state, dismiss };
}

const FALLBACK_PLACE_NAME = 'Din posisjon';

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
