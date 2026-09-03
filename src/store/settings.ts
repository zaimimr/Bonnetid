import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { NotificationSoundKey } from '@/lib/notificationSounds';
import type { PrayerName } from '@/lib/prayerSchedule';

export type SavedLocation = {
  iso: string;
  name: string;
  lat: number;
  lon: number;
};

export type SavedMosque = {
  orgNr: string;
  name: string;
};

export type AsrMethodPreference = 'irn' | 'shadow_1x' | 'shadow_2x' | 'wusta';
type ThemePreference = 'system' | 'light' | 'dark';

export type NotifiablePrayer = Exclude<PrayerName, 'fajr_endtime'>;

export const NOTIFIABLE_PRAYERS: NotifiablePrayer[] = ['fajr', 'duhr', 'asr', 'maghrib', 'isha'];

const ALL_PRAYERS_ENABLED: Record<NotifiablePrayer, boolean> = {
  fajr: true,
  duhr: true,
  asr: true,
  maghrib: true,
  isha: true,
};

type SettingsState = {
  location: SavedLocation | null;
  mosque: SavedMosque | null;
  asrMethod: AsrMethodPreference | null;
  themePreference: ThemePreference;
  notificationsEnabled: boolean;
  notificationSound: NotificationSoundKey;
  notificationPrayers: Record<NotifiablePrayer, boolean>;
  endReminderEnabled: boolean;
  liveActivityEnabled: boolean;
  widgetShowJamat: boolean;
  ramadanRemindersEnabled: boolean;
  launchCount: number;
  reviewRequested: boolean;
  registerLaunch: () => void;
  markReviewRequested: () => void;
  setLocation: (location: SavedLocation) => void;
  setMosque: (mosque: SavedMosque | null) => void;
  setAsrMethod: (method: AsrMethodPreference) => void;
  setThemePreference: (preference: ThemePreference) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setNotificationSound: (sound: NotificationSoundKey) => void;
  toggleNotificationPrayer: (prayer: NotifiablePrayer) => void;
  setEndReminderEnabled: (enabled: boolean) => void;
  setLiveActivityEnabled: (enabled: boolean) => void;
  setWidgetShowJamat: (enabled: boolean) => void;
  setRamadanRemindersEnabled: (enabled: boolean) => void;
};

export const DEFAULT_LOCATION: SavedLocation = {
  iso: 'NO0301',
  name: 'Oslo',
  lat: 59.9139,
  lon: 10.7522,
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      location: null,
      mosque: null,
      asrMethod: null,
      themePreference: 'system',
      notificationsEnabled: false,
      notificationSound: 'default',
      notificationPrayers: ALL_PRAYERS_ENABLED,
      endReminderEnabled: true,
      liveActivityEnabled: true,
      widgetShowJamat: false,
      ramadanRemindersEnabled: true,
      launchCount: 0,
      reviewRequested: false,
      registerLaunch: () => set((state) => ({ launchCount: state.launchCount + 1 })),
      markReviewRequested: () => set({ reviewRequested: true }),
      setLocation: (location) =>
        set((state) =>
          state.location?.iso === location.iso ? { location } : { location, asrMethod: null },
        ),
      setMosque: (mosque) => set({ mosque }),
      setAsrMethod: (asrMethod) => set({ asrMethod }),
      setThemePreference: (themePreference) => set({ themePreference }),
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
      setNotificationSound: (notificationSound) => set({ notificationSound }),
      setEndReminderEnabled: (endReminderEnabled) => set({ endReminderEnabled }),
      setLiveActivityEnabled: (liveActivityEnabled) => set({ liveActivityEnabled }),
      setWidgetShowJamat: (widgetShowJamat) => set({ widgetShowJamat }),
      setRamadanRemindersEnabled: (ramadanRemindersEnabled) => set({ ramadanRemindersEnabled }),
      toggleNotificationPrayer: (prayer) =>
        set((state) => ({
          notificationPrayers: {
            ...state.notificationPrayers,
            [prayer]: !state.notificationPrayers[prayer],
          },
        })),
    }),
    {
      name: 'bonnetid-settings',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      migrate: (persisted) => {
        const state = persisted as Partial<SettingsState> | undefined;
        if (state?.location && typeof (state.location as { iso?: unknown }).iso !== 'string') {
          state.location = null;
        }
        return state as SettingsState;
      },
    },
  ),
);

export function useActiveLocation(): SavedLocation {
  return useSettings((state) => state.location) ?? DEFAULT_LOCATION;
}

export function useHasChosenLocation(): boolean {
  return useSettings((state) => state.location) != null;
}
