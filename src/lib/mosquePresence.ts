import type { Mosque } from '@/api/types';
import { distanceKm } from './geo';

export const PRESENCE_RADIUS_M = 100;
export const PRESENCE_MAX_ACCURACY_M = 75;

export type MosquePresence = {
  mosque: Mosque;
  distanceM: number;
};

export function findMosquePresence(
  mosques: readonly Mosque[],
  coords: { lat: number; lon: number } | null,
  accuracyM: number | null,
): MosquePresence | null {
  if (!coords || accuracyM == null || accuracyM > PRESENCE_MAX_ACCURACY_M) return null;

  let best: MosquePresence | null = null;
  for (const mosque of mosques) {
    if (mosque.lat == null || mosque.lon == null) continue;
    const distanceM = distanceKm(coords.lat, coords.lon, mosque.lat, mosque.lon) * 1000;
    if (best == null || distanceM < best.distanceM) best = { mosque, distanceM };
  }

  return best && best.distanceM <= PRESENCE_RADIUS_M ? best : null;
}
