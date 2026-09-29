import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DEFAULT_CALCULATION_METHOD, type CalculationMethodKey } from '@/lib/calculationMethods';
import type { NotificationSoundKey } from '@/lib/notificationSounds';
import type { PrayerName } from '@/lib/prayerSchedule';

export type LocationMode = 'norway' | 'calculated';

export const CALCULATED_LOCATION_ISO = 'LOCAL';

export type SavedLocation = {
  iso: string;
  name: string;
  lat: number;
  lon: number;
  mode: LocationMode;
  countryCode?: string | null;
  country?: string | null;
};

export type PlaceCountry = {
  countryCode: string | null;
  country: string | null;
};

export type SavedMosque = {
  orgNr: string;
  name: string;
};

export type AsrMethodPreference = 'irn' | 'shadow_1x' | 'shadow_2x' | 'wusta';
type ThemePreference = 'system' | 'light' | 'dark';

export type NotifiablePrayer = Exclude<PrayerName, 'fajr_endtime'>;

export const NOTIFIABLE_PRAYERS: NotifiablePrayer[] = ['fajr', 'duhr', 'asr', 'maghrib', 'isha'];

export type VoluntaryFastKind = 'ashura' | 'whiteDays' | 'mondayThursday';

export const VOLUNTARY_FAST_KINDS: VoluntaryFastKind[] = [
  'ashura',
  'whiteDays',
  'mondayThursday',
];

const NO_VOLUNTARY_FASTS: Record<VoluntaryFastKind, boolean> = {
  ashura: false,
  whiteDays: false,
  mondayThursday: false,
};

const ALL_PRAYERS_ENABLED: Record<NotifiablePrayer, boolean> = {
  fajr: true,
  duhr: true,
  asr: true,
  maghrib: true,
  isha: true,
};

type SettingsState = {
  location: SavedLocation | null;
  homeLocation: SavedLocation | null;
  calculationMethod: CalculationMethodKey | null;
  mosque: SavedMosque | null;
  asrMethod: AsrMethodPreference | null;
  themePreference: ThemePreference;
  notificationsEnabled: boolean;
  notificationSound: NotificationSoundKey;
  notificationPrayers: Record<NotifiablePrayer, boolean>;
  endReminderEnabled: boolean;
  prayerTrackerEnabled: boolean;
  liveActivityEnabled: boolean;
  widgetShowJamat: boolean;
  ramadanRemindersEnabled: boolean;
  dhulHijjahRemindersEnabled: boolean;
  voluntaryFasts: Record<VoluntaryFastKind, boolean>;
  launchCount: number;
  reviewRequested: boolean;
  onboardingDone: boolean;
  readAnnouncements: Record<string, string>;
  markAnnouncementRead: (orgNr: string, announcement: string) => void;
  completeOnboarding: () => void;
  registerLaunch: () => void;
  markReviewRequested: () => void;
  setLocation: (location: SavedLocation) => void;
  setCalculationMethod: (method: CalculationMethodKey | null) => void;
  setMosque: (mosque: SavedMosque | null) => void;
  setAsrMethod: (method: AsrMethodPreference) => void;
  setThemePreference: (preference: ThemePreference) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setNotificationSound: (sound: NotificationSoundKey) => void;
  toggleNotificationPrayer: (prayer: NotifiablePrayer) => void;
  setEndReminderEnabled: (enabled: boolean) => void;
  setPrayerTrackerEnabled: (enabled: boolean) => void;
  setLiveActivityEnabled: (enabled: boolean) => void;
  setWidgetShowJamat: (enabled: boolean) => void;
  setRamadanRemindersEnabled: (enabled: boolean) => void;
  setDhulHijjahRemindersEnabled: (enabled: boolean) => void;
  toggleVoluntaryFast: (kind: VoluntaryFastKind) => void;
};

export const DEFAULT_LOCATION: SavedLocation = {
  iso: 'NO0301',
  name: 'Oslo',
  lat: 59.9139,
  lon: 10.7522,
  mode: 'norway',
};

export function calculatedLocation(
  name: string,
  lat: number,
  lon: number,
  place: PlaceCountry = { countryCode: null, country: null },
): SavedLocation {
  return {
    iso: CALCULATED_LOCATION_ISO,
    name,
    lat,
    lon,
    mode: 'calculated',
    countryCode: place.countryCode,
    country: place.country,
  };
}

function countryChanged(previous: SavedLocation | null, next: SavedLocation): boolean {
  if (next.mode !== 'calculated') return false;
  return (previous?.countryCode ?? null) !== (next.countryCode ?? null);
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      location: null,
      homeLocation: null,
      calculationMethod: null,
      mosque: null,
      asrMethod: null,
      themePreference: 'system',
      notificationsEnabled: false,
      notificationSound: 'default',
      notificationPrayers: ALL_PRAYERS_ENABLED,
      endReminderEnabled: true,
      prayerTrackerEnabled: false,
      liveActivityEnabled: true,
      widgetShowJamat: false,
      ramadanRemindersEnabled: true,
      dhulHijjahRemindersEnabled: true,
      voluntaryFasts: NO_VOLUNTARY_FASTS,
      launchCount: 0,
      reviewRequested: false,
      onboardingDone: false,
      readAnnouncements: {},
      markAnnouncementRead: (orgNr, announcement) =>
        set((state) => ({
          readAnnouncements: { ...state.readAnnouncements, [orgNr]: announcement },
        })),
      completeOnboarding: () => set({ onboardingDone: true }),
      registerLaunch: () => set((state) => ({ launchCount: state.launchCount + 1 })),
      markReviewRequested: () => set({ reviewRequested: true }),
      setLocation: (location) =>
        set((state) => {
          const home = location.mode === 'norway' ? location : state.homeLocation;
          const unchanged = state.location?.iso === location.iso;
          const calculationMethod = countryChanged(state.location, location)
            ? null
            : state.calculationMethod;
          return unchanged
            ? { location, homeLocation: home, calculationMethod }
            : { location, homeLocation: home, asrMethod: null, calculationMethod };
        }),
      setCalculationMethod: (calculationMethod) => set({ calculationMethod }),
      setMosque: (mosque) => set({ mosque }),
      setAsrMethod: (asrMethod) => set({ asrMethod }),
      setThemePreference: (themePreference) => set({ themePreference }),
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
      setNotificationSound: (notificationSound) => set({ notificationSound }),
      setEndReminderEnabled: (endReminderEnabled) => set({ endReminderEnabled }),
      setPrayerTrackerEnabled: (prayerTrackerEnabled) => set({ prayerTrackerEnabled }),
      setLiveActivityEnabled: (liveActivityEnabled) => set({ liveActivityEnabled }),
      setWidgetShowJamat: (widgetShowJamat) => set({ widgetShowJamat }),
      setRamadanRemindersEnabled: (ramadanRemindersEnabled) => set({ ramadanRemindersEnabled }),
      setDhulHijjahRemindersEnabled: (dhulHijjahRemindersEnabled) =>
        set({ dhulHijjahRemindersEnabled }),
      toggleVoluntaryFast: (kind) =>
        set((state) => ({
          voluntaryFasts: {
            ...state.voluntaryFasts,
            [kind]: !state.voluntaryFasts[kind],
          },
        })),
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
      version: 4,
      migrate: (persisted) => {
        const state = persisted as Partial<SettingsState> | undefined;
        if (!state) return persisted as SettingsState;
        state.onboardingDone = state.onboardingDone ?? true;
        if (state.location && typeof (state.location as { iso?: unknown }).iso !== 'string') {
          state.location = null;
        }
        state.voluntaryFasts = { ...NO_VOLUNTARY_FASTS, ...(state.voluntaryFasts ?? {}) };
        state.location = withMode(state.location);
        state.homeLocation = withMode(state.homeLocation);
        if (!state.homeLocation && state.location?.mode === 'norway') {
          state.homeLocation = state.location;
        }
        if (state.calculationMethod === DEFAULT_CALCULATION_METHOD) {
          state.calculationMethod = null;
        }
        return state as SettingsState;
      },
    },
  ),
);

function withMode(location: SavedLocation | null | undefined): SavedLocation | null {
  if (!location) return null;
  if (location.mode === 'norway' || location.mode === 'calculated') return location;
  return { ...location, mode: 'norway' };
}

export function useActiveLocation(): SavedLocation {
  return useSettings((state) => state.location) ?? DEFAULT_LOCATION;
}

export function useLocationMode(): LocationMode {
  return useSettings((state) => state.location)?.mode ?? DEFAULT_LOCATION.mode;
}

export function useIsCalculatedMode(): boolean {
  return useLocationMode() === 'calculated';
}

export function useUnreadAnnouncement(
  orgNr: string | null | undefined,
  announcement: string | null | undefined,
): string | null {
  const read = useSettings((state) => (orgNr ? state.readAnnouncements[orgNr] : undefined));
  return announcement && read !== announcement ? announcement : null;
}

export function useActiveMosque(): SavedMosque | null {
  const mosque = useSettings((state) => state.mosque);
  const calculated = useIsCalculatedMode();
  return calculated ? null : mosque;
}

export function useHomeLocation(): SavedLocation | null {
  return useSettings((state) => state.homeLocation);
}

export function usePrayerTrackerEnabled(): boolean {
  return useSettings((state) => state.prayerTrackerEnabled);
}

export function useHasChosenLocation(): boolean {
  return useSettings((state) => state.location) != null;
}

export function useOnboardingDone(): boolean {
  return useSettings((state) => state.onboardingDone);
}

export function useSettingsHydrated(): boolean {
  return useSyncExternalStore(
    (listener) => useSettings.persist.onFinishHydration(listener),
    () => useSettings.persist.hasHydrated(),
  );
}
