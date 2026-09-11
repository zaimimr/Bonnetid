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
const MOVE_RESET_MIN_M = 25;
const MOVE_RESET_ACCURACY_FACTOR = 3;
const OUTLIER_MIN_M = 30;
const OUTLIER_ACCURACY_FACTOR = 4;
const MIN_SAMPLES_FOR_OUTLIER_REJECTION = 3;

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

export function pruneSamples(samples: PositionSample[], now: number): PositionSample[] {
  return samples.filter((sample) => now - sample.timestamp <= SAMPLE_WINDOW_MS).slice(-MAX_SAMPLES);
}

export function ingestSample(
  samples: PositionSample[],
  next: PositionSample,
): PositionSample[] {
  const appended = pruneSamples([...samples, next], next.timestamp);
  const previous = fusePosition(samples);
  if (!previous) return appended;

  const jumpLimitM = Math.max(
    next.accuracyM * MOVE_RESET_ACCURACY_FACTOR,
    MOVE_RESET_MIN_M,
  );
  const metresAway = (sample: PositionSample) =>
    distanceKm(previous.lat, previous.lon, sample.lat, sample.lon) * 1000;

  if (metresAway(next) <= jumpLimitM) return appended;

  const secondLast = samples[samples.length - 1];
  if (secondLast && metresAway(secondLast) > jumpLimitM) {
    return [secondLast, next];
  }
  return appended;
}

export function fusePosition(samples: PositionSample[]): FusedPosition | null {
  if (samples.length === 0) return null;

  const usable = samples.map((sample) => ({
    ...sample,
    accuracyM: sample.accuracyM > 0 ? sample.accuracyM : FALLBACK_ACCURACY_M,
  }));

  const bestAccuracy = Math.min(...usable.map((sample) => sample.accuracyM));
  const centreLat = median(usable.map((sample) => sample.lat));
  const centreLon = median(usable.map((sample) => sample.lon));
  const filtered = usable.filter((sample) => {
    if (sample.accuracyM > bestAccuracy * WORST_ACCURACY_RATIO) return false;
    if (usable.length < MIN_SAMPLES_FOR_OUTLIER_REJECTION) return true;
    const strayM = distanceKm(centreLat, centreLon, sample.lat, sample.lon) * 1000;
    return strayM <= Math.max(sample.accuracyM * OUTLIER_ACCURACY_FACTOR, OUTLIER_MIN_M);
  });
  const kept = filtered.length > 0 ? filtered : usable;

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
