import { requireOptionalNativeModule } from 'expo';

export type PrayerActivityState = {
  locationName: string;
  prayerLabel: string;
  prayerKind: string;
  /** Epoch seconds. */
  prayerAt: number;
  windowStart: number;
  windowEnd: number;
  isNow: boolean;
  nextLabel: string;
};

type PrayerWidgetNativeModule = {
  setSnapshot: (json: string) => void;
  areLiveActivitiesEnabled: () => boolean;
  startOrUpdateActivity: (state: PrayerActivityState) => Promise<void>;
  endActivity: () => Promise<void>;
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
