import { create } from 'zustand';

type PlaceFilterState = {
  placeIso: string | null;
  setPlaceIso: (iso: string | null) => void;
};

export const usePlaceFilter = create<PlaceFilterState>((set) => ({
  placeIso: null,
  setPlaceIso: (iso) => set({ placeIso: iso }),
}));
