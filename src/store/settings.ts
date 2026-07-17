import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type SavedLocation = {
  pk: number;
  name: string;
  lat: number;
  lon: number;
};

export type SavedMosque = {
  orgNr: string;
  name: string;
};

export type AsrMethodPreference = 'shadow_1x' | 'shadow_2x';
type ThemePreference = 'system' | 'light' | 'dark';

type SettingsState = {
  location: SavedLocation | null;
  mosque: SavedMosque | null;
  asrMethod: AsrMethodPreference;
  themePreference: ThemePreference;
  notificationsEnabled: boolean;
  setLocation: (location: SavedLocation) => void;
  setMosque: (mosque: SavedMosque | null) => void;
  setAsrMethod: (method: AsrMethodPreference) => void;
  setThemePreference: (preference: ThemePreference) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
};

export const DEFAULT_LOCATION: SavedLocation = {
  pk: 181,
  name: 'Oslo',
  lat: 59.9139,
  lon: 10.7522,
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      location: null,
      mosque: null,
      asrMethod: 'shadow_1x',
      themePreference: 'system',
      notificationsEnabled: false,
      setLocation: (location) => set({ location }),
      setMosque: (mosque) => set({ mosque }),
      setAsrMethod: (asrMethod) => set({ asrMethod }),
      setThemePreference: (themePreference) => set({ themePreference }),
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
    }),
    {
      name: 'bonnetid-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export function useActiveLocation(): SavedLocation {
  return useSettings((state) => state.location) ?? DEFAULT_LOCATION;
}

export function useHasChosenLocation(): boolean {
  return useSettings((state) => state.location) != null;
}
