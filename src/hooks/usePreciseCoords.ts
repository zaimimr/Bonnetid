import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { fusePosition, ingestSample, type PositionSample } from '@/lib/positionFilter';
import { useActiveLocation } from '@/store/settings';

export type PreciseCoords = {
  lat: number;
  lon: number;
  accuracyM: number | null;
  sampleCount: number;
  source: 'gps' | 'settings';
};

const SAMPLE_INTERVAL_MS = 2000;

export function usePreciseCoords(active: boolean): PreciseCoords {
  const fallback = useActiveLocation();
  const samples = useRef<PositionSample[]>([]);
  const [fused, setFused] = useState<PreciseCoords | null>(null);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function sampleOnce() {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
      if (cancelled) return;

      samples.current = ingestSample(samples.current, {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
        accuracyM: position.coords.accuracy ?? 0,
        timestamp: Date.now(),
      });
      const next = fusePosition(samples.current);
      if (next) {
        setFused({ ...next, source: 'gps' });
      }
    }

    async function loop() {
      await sampleOnce().catch(() => {});
      if (!cancelled) {
        timer = setTimeout(loop, SAMPLE_INTERVAL_MS);
      }
    }

    async function start() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || cancelled) return;
      await loop();
    }

    start().catch(() => {});
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [active]);

  if (fused) return fused;
  return {
    lat: fallback.lat,
    lon: fallback.lon,
    accuracyM: null,
    sampleCount: 0,
    source: 'settings',
  };
}
