import { requireOptionalNativeModule } from 'expo';

export type PrayerActivityState = {
  locationName: string;
  /** Calendar day of the prayer; the buttons write the log under this key. */
  isoDate: string;
  prayerLabel: string;
  prayerKind: string;
  /** Epoch seconds. */
  prayerAt: number;
  /** End of the prayer's window, also the activity's stale date. */
  windowEnd: number;
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

export function readNativePrayerLog(): string | null {
  return native?.getPrayerLog() ?? null;
}

export function writeNativePrayerLog(log: unknown) {
  native?.setPrayerLog(JSON.stringify(log));
}
