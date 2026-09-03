import { requireOptionalNativeModule } from 'expo';

export type PrayerActivityState = {
  locationName: string;
  prayerLabel: string;
  prayerKind: string;
  /** Epoch seconds. */
  prayerAt: number;
  /** Bounds of the phase being shown, for the progress bar. */
  windowStart: number;
  windowEnd: number;
  isNow: boolean;
  /** When the activity should leave the screen for good. */
  dismissAt: number;
};

type PrayerWidgetNativeModule = {
  setSnapshot: (json: string) => void;
  areLiveActivitiesEnabled: () => boolean;
  startOrUpdateActivity: (state: PrayerActivityState) => Promise<void>;
  endActivity: () => Promise<void>;
  getPrayerLog: () => string | null;
  setPrayerLog: (json: string) => void;
};

/** Null in Expo Go and on web: every call below turns into a no-op. */
const native = requireOptionalNativeModule<PrayerWidgetNativeModule>('PrayerWidget');

export const prayerWidgetAvailable = native != null;

export function setPrayerSnapshot(snapshot: unknown) {
  native?.setSnapshot(JSON.stringify(snapshot));
}

export function liveActivitiesEnabled() {
  return native?.areLiveActivitiesEnabled() ?? false;
}

export async function startOrUpdatePrayerActivity(state: PrayerActivityState) {
  await native?.startOrUpdateActivity(state);
}

export async function endPrayerActivity() {
  await native?.endActivity();
}

/** JSON of `PrayerLog` (see src/lib/prayerLog.ts) as last written by the app or a native surface. */
export function readNativePrayerLog(): string | null {
  return native?.getPrayerLog() ?? null;
}

export function writeNativePrayerLog(log: unknown) {
  native?.setPrayerLog(JSON.stringify(log));
}
