import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { BRAND_OPTIONS } from './theme';
import type { BaseScreen, ScreenId } from './tvModel';

export const ART_OPTIONS = ['mosque', 'kaaba', 'lantern', 'moon', 'none'] as const;
export type ArtChoice = (typeof ART_OPTIONS)[number];

export const DUA_FONTS = ['Amiri', 'ScheherazadeNew', 'NotoNaskhArabic', 'ReemKufi', 'ArefRuqaa', 'NotoNastaliqUrdu'] as const;
export type DuaFont = (typeof DUA_FONTS)[number];

export const HALL_OPTIONS = ['Hovedsalen', 'Kvinneavdelingen', 'Sal 2', 'Ungdomssalen', 'Kafeen'] as const;

type TvSettings = {
  orgNr: string | null;
  base: BaseScreen;
  brand: string;
  art: ArtChoice;
  duaFont: DuaFont;
  translation: boolean;
  texture: boolean;
  hall: string;
  preview: ScreenId | null;
  set: (patch: Partial<Omit<TvSettings, 'set'>>) => void;
};

export const useTvSettings = create<TvSettings>()(
  persist(
    (set) => ({
      orgNr: null,
      base: 'main',
      brand: BRAND_OPTIONS[0],
      art: 'mosque',
      duaFont: 'Amiri',
      translation: true,
      texture: true,
      hall: HALL_OPTIONS[1],
      preview: null,
      set: (patch) => set(patch),
    }),
    {
      name: 'tv-settings-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ set: _set, preview: _preview, ...rest }) => rest,
    },
  ),
);

type Taraweeh = {
  night: string | null;
  pauses: number;
  duaUntil: number | null;
  press: (night: string, now: number, showMs: number) => void;
  dismiss: () => void;
};

export const useTaraweeh = create<Taraweeh>()(
  persist(
    (set, get) => ({
      night: null,
      pauses: 0,
      duaUntil: null,
      press: (night, now, showMs) => {
        const state = get();
        if (state.duaUntil && now < state.duaUntil) {
          set({ duaUntil: null });
          return;
        }
        const pauses = state.night === night ? state.pauses + 1 : 1;
        set({ night, pauses, duaUntil: now + showMs });
      },
      dismiss: () => set({ duaUntil: null }),
    }),
    {
      name: 'tv-taraweeh-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ night, pauses }) => ({ night, pauses }),
    },
  ),
);
