import { useMemo } from 'react';
import { useMosques } from '@/api/queries';
import { useSharedPosition } from '@/hooks/useTravelDetection';
import { findMosquePresence, type MosquePresence } from '@/lib/mosquePresence';

export function useMosquePresence(): MosquePresence | null {
  const { data: mosques } = useMosques();
  const { coords, accuracyM } = useSharedPosition();

  return useMemo(
    () => (mosques ? findMosquePresence(mosques, coords, accuracyM) : null),
    [mosques, coords, accuracyM],
  );
}
