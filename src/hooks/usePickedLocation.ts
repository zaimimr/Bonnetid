import { useMemo } from 'react';
import { useLocations } from '@/api/queries';
import type { SavedLocation } from '@/store/settings';

export function usePickedLocation(iso: string | null | undefined): SavedLocation | null {
  const locations = useLocations();

  return useMemo(() => {
    if (!iso) return null;
    const match = locations.data?.find((location) => location.iso === iso);
    if (!match) return null;
    return { iso: match.iso, name: match.name, lat: match.lat, lon: match.lon, mode: 'norway' };
  }, [iso, locations.data]);
}
