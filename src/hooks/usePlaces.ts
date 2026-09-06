import { useMemo } from 'react';
import { useLocations, useMosques } from '@/api/queries';
import { buildPlaces, placesByIso, type Place } from '@/lib/places';
import { usePlaceFilter } from '@/store/placeFilter';

export type PlacesResult = {
  places: Place[];
  byIso: Map<string, Place>;
  selected: Place | null;
  isLoading: boolean;
  isError: boolean;
};

export function usePlaces(): PlacesResult {
  const mosques = useMosques();
  const locations = useLocations();
  const placeIso = usePlaceFilter((state) => state.placeIso);

  const places = useMemo(() => {
    if (!mosques.data || !locations.data) return [];
    return buildPlaces(mosques.data, locations.data);
  }, [mosques.data, locations.data]);

  const byIso = useMemo(() => placesByIso(places), [places]);

  return {
    places,
    byIso,
    selected: placeIso ? (byIso.get(placeIso) ?? null) : null,
    isLoading: mosques.isLoading || locations.isLoading,
    isError: mosques.isError || locations.isError,
  };
}
