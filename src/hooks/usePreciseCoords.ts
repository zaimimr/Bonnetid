import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { fusePosition, pruneSamples, type PositionSample } from '@/lib/positionFilter';
import { useActiveLocation } from '@/store/settings';

export type PreciseCoords = {
  lat: number;
  lon: number;
  accuracyM: number | null;
  sampleCount: number;
  source: 'gps' | 'settings';
};

export function usePreciseCoords(active: boolean): PreciseCoords {
  const fallback = useActiveLocation();
  const samples = useRef<PositionSample[]>([]);
  const [fused, setFused] = useState<PreciseCoords | null>(null);

  useEffect(() => {
    if (!active) return;

    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;

    async function subscribe() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || cancelled) return;

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 0,
        },
        (position) => {
          if (cancelled) return;
          const now = Date.now();
          samples.current = pruneSamples(
            [
              ...samples.current,
              {
                lat: position.coords.latitude,
                lon: position.coords.longitude,
                accuracyM: position.coords.accuracy ?? 0,
                timestamp: position.timestamp ?? now,
              },
            ],
            now,
          );
          const next = fusePosition(samples.current);
          if (next) {
            setFused({ ...next, source: 'gps' });
          }
        },
      );
    }

    subscribe().catch(() => {});
    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [active]);

  if (fused) return fused;
  return { lat: fallback.lat, lon: fallback.lon, accuracyM: null, sampleCount: 0, source: 'settings' };
}
