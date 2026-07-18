import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { useLocations } from '@/api/queries';
import type { ApiLocation } from '@/api/types';
import { nearestLocation } from './useNearestLocation';
import { useSettings, type SavedLocation } from '@/store/settings';

export async function detectNearestLocation(
  locations: ApiLocation[],
): Promise<SavedLocation | null> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return null;
  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  const nearest = nearestLocation(locations, position.coords.latitude, position.coords.longitude);
  return nearest
    ? { iso: nearest.iso, name: nearest.name, lat: nearest.lat, lon: nearest.lon }
    : null;
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
