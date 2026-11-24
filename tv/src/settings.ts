import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { BRAND_OPTIONS } from './theme';
import type { BaseScreen, Rotation, ScreenId } from './tvModel';

export const ART_OPTIONS = ['mosque', 'kaaba', 'lantern', 'moon', 'none'] as const;
export type ArtChoice = (typeof ART_OPTIONS)[number];

export const DUA_FONTS = ['Amiri', 'ScheherazadeNew', 'NotoNaskhArabic', 'ReemKufi', 'ArefRuqaa', 'NotoNastaliqUrdu'] as const;
export type DuaFont = (typeof DUA_FONTS)[number];

export const HIDE_KEYS = [
  'main.fajrEnd',
  'main.timeline',
  'main.note',
  'main.hijri',
  'main.app',
  'lobby.times',
  'lobby.note',
  'lobby.vipps',
  'plakat.note',
  'plakat.vipps',
  'rad.fajrEnd',
  'rad.timeline',
  'iqamah.tips',
  'jumuah.vipps',
] as const;
export type HideKey = (typeof HIDE_KEYS)[number];

export const IQAMAH_LEADS = [5, 10, 15] as const;

export const HALL_OPTIONS = ['Hovedsalen', 'Kvinneavdelingen', 'Sal 2', 'Ungdomssalen', 'Kafeen'] as const;

export type TvSettings = {
  orgNr: string | null;
  configured: boolean;
  rotation: BaseScreen[];
  seconds: number;
  iqamahLead: number;
  hide: HideKey[];
  dim: boolean;
  brand: string;
  art: ArtChoice;
  duaFont: DuaFont;
  translation: boolean;
  texture: boolean;
  hall: string;
  preview: ScreenId | null;
  pairId: string | null;
  pairSecret: string | null;
  pairUpdated: number;
  set: (patch: Partial<Omit<TvSettings, 'set'>>) => void;
};

export const useTvSettings = create<TvSettings>()(
  persist(
    (set) => ({
      orgNr: null,
      configured: false,
      rotation: ['main'],
      seconds: 20,
      iqamahLead: 10,
      hide: [],
      dim: false,
      brand: BRAND_OPTIONS[0],
      art: 'mosque',
      duaFont: 'Amiri',
      translation: true,
      texture: true,
      hall: HALL_OPTIONS[1],
      preview: null,
      pairId: null,
      pairSecret: null,
      pairUpdated: 0,
      set: (patch) => set(patch),
    }),
    {
      name: 'tv-settings-v1',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ set: _set, preview: _preview, ...rest }) => rest,
      migrate: (persisted, version) => {
        const old = persisted as Record<string, unknown>;
        if (version >= 1) return old as never;
        const { base, ...rest } = old;
        return { ...rest, rotation: [base ?? 'main'], configured: old.orgNr != null } as never;
      },
    },
  ),
);

export function rotationOf(settings: TvSettings): Rotation {
  return { screens: settings.rotation, seconds: settings.seconds, iqamahLead: settings.iqamahLead };
}

export function screenOptionsOf(settings: TvSettings) {
  return {
    art: settings.art,
    duaFont: settings.duaFont,
    translation: settings.translation,
    texture: settings.texture,
    hall: settings.hall,
    hide: settings.hide,
    iqamahLead: settings.iqamahLead,
    dim: settings.dim,
  };
}

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
