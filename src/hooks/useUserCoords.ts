import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { useActiveLocation } from '@/store/settings';

export type UserCoords = {
  lat: number;
  lon: number;
  source: 'gps' | 'settings';
};

export function useUserCoords(): UserCoords {
  const fallback = useActiveLocation();
  const [coords, setCoords] = useState<UserCoords | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function locate() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (!cancelled) {
        setCoords({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          source: 'gps',
        });
      }
    }

    locate().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return coords ?? { lat: fallback.lat, lon: fallback.lon, source: 'settings' };
}
