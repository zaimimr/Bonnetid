import { distanceKm } from './geo';

export type PositionSample = {
  lat: number;
  lon: number;
  accuracyM: number;
  timestamp: number;
};

export type FusedPosition = {
  lat: number;
  lon: number;
  accuracyM: number;
  sampleCount: number;
};

export const SAMPLE_WINDOW_MS = 30_000;
export const MAX_SAMPLES = 12;
const WORST_ACCURACY_RATIO = 3;
const FALLBACK_ACCURACY_M = 50;

export function pruneSamples(samples: PositionSample[], now: number): PositionSample[] {
  return samples.filter((sample) => now - sample.timestamp <= SAMPLE_WINDOW_MS).slice(-MAX_SAMPLES);
}

export function fusePosition(samples: PositionSample[]): FusedPosition | null {
  if (samples.length === 0) return null;

  const usable = samples.map((sample) => ({
    ...sample,
    accuracyM: sample.accuracyM > 0 ? sample.accuracyM : FALLBACK_ACCURACY_M,
  }));

  const bestAccuracy = Math.min(...usable.map((sample) => sample.accuracyM));
  const kept = usable.filter((sample) => sample.accuracyM <= bestAccuracy * WORST_ACCURACY_RATIO);

  let weightSum = 0;
  let latSum = 0;
  let lonSum = 0;
  for (const sample of kept) {
    const weight = 1 / (sample.accuracyM * sample.accuracyM);
    weightSum += weight;
    latSum += sample.lat * weight;
    lonSum += sample.lon * weight;
  }

  const lat = latSum / weightSum;
  const lon = lonSum / weightSum;
  const combinedAccuracy = 1 / Math.sqrt(weightSum);
  const spread = Math.max(
    ...kept.map((sample) => distanceKm(lat, lon, sample.lat, sample.lon) * 1000),
  );

  return {
    lat,
    lon,
    accuracyM: Math.max(combinedAccuracy, spread),
    sampleCount: kept.length,
  };
}
