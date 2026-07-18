import { useCallback, useState } from 'react';
import * as Location from 'expo-location';
import type { ApiLocation } from '@/api/types';
import { distanceKm } from '@/lib/geo';

export function nearestLocation(
  locations: ApiLocation[],
  lat: number,
  lon: number,
): ApiLocation | null {
  let best: ApiLocation | null = null;
  let bestDistance = Infinity;
  for (const location of locations) {
    const distance = distanceKm(lat, lon, Number(location.lat), Number(location.lon));
    if (distance < bestDistance) {
      bestDistance = distance;
      best = location;
    }
  }
  return best;
}

export type GpsStatus = 'idle' | 'locating' | 'denied' | 'error';

type DevicePositionState = {
  status: GpsStatus;
  getPosition: () => Promise<{ lat: number; lon: number } | null>;
};

export function useDevicePosition(): DevicePositionState {
  const [status, setStatus] = useState<GpsStatus>('idle');

  const getPosition = useCallback(async () => {
    setStatus('locating');
    try {
      const { status: permission } = await Location.requestForegroundPermissionsAsync();
      if (permission !== 'granted') {
        setStatus('denied');
        return null;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setStatus('idle');
      return { lat: position.coords.latitude, lon: position.coords.longitude };
    } catch {
      setStatus('error');
      return null;
    }
  }, []);

  return { status, getPosition };
}

type NearestLocationState = {
  status: GpsStatus;
  locate: (locations: ApiLocation[]) => Promise<ApiLocation | null>;
};

export function useNearestLocation(): NearestLocationState {
  const { status, getPosition } = useDevicePosition();

  const locate = useCallback(
    async (locations: ApiLocation[]) => {
      const coords = await getPosition();
      if (!coords) return null;
      return nearestLocation(locations, coords.lat, coords.lon);
    },
    [getPosition],
  );

  return { status, locate };
}
