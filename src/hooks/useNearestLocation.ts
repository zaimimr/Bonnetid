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

type NearestLocationState = {
  status: 'idle' | 'locating' | 'denied' | 'error';
  locate: (locations: ApiLocation[]) => Promise<ApiLocation | null>;
};

export function useNearestLocation(): NearestLocationState {
  const [status, setStatus] = useState<NearestLocationState['status']>('idle');

  const locate = useCallback(async (locations: ApiLocation[]) => {
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
      return nearestLocation(locations, position.coords.latitude, position.coords.longitude);
    } catch {
      setStatus('error');
      return null;
    }
  }, []);

  return { status, locate };
}
