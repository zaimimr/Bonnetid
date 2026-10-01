import { create } from 'zustand';

export type PlaceScope = 'mosques' | 'times';

type PlaceFilterState = {
  placeIso: string | null;
  timesPlaceIso: string | null;
  setPlaceIso: (iso: string | null) => void;
  setTimesPlaceIso: (iso: string | null) => void;
};

export const usePlaceFilter = create<PlaceFilterState>((set) => ({
  placeIso: null,
  timesPlaceIso: null,
  setPlaceIso: (iso) => set({ placeIso: iso }),
  setTimesPlaceIso: (iso) => set({ timesPlaceIso: iso }),
}));
