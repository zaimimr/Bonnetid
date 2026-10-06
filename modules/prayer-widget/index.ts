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
  showMarkButtons: boolean;
  /** The prayer after this one, rendered once the activity goes stale. Empty kind means none. */
  nextIsoDate: string;
  nextLabel: string;
  nextKind: string;
  nextAt: number;
  nextWindowEnd: number;
};

type PrayerWidgetNativeModule = {
  setSnapshot: (json: string) => void;
  areLiveActivitiesEnabled: () => boolean;
  hasDynamicIsland?: () => boolean;
  isTestFlight?: () => boolean;
  windowGeometry?: () => Promise<WindowGeometry>;
  startOrUpdateActivity: (state: PrayerActivityState) => Promise<void>;
  endActivity: () => Promise<void>;
  getPrayerLog: () => string | null;
  setPrayerLog: (json: string) => void;
  setNotificationQueue?: (json: string) => void;
  canScheduleExactAlarms?: () => boolean;
  isIgnoringBatteryOptimizations?: () => boolean;
  openSystemSettings?: (kind: SystemSettingsKind) => void;
};

export type FoldFrame = { x: number; y: number; width: number; height: number };

export type WindowGeometry = { rotation: number; fold?: FoldFrame };

export type SystemSettingsKind = 'notifications' | 'exactAlarm' | 'battery';

export type QueuedNotification = {
  identifier: string;
  title: string;
  body: string;
  /** Epoch seconds. */
  at: number;
  sound: string | null;
  category: string | null;
  isoDate: string;
  prayer: string;
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

export function isTestFlight() {
  try {
    return native?.isTestFlight?.() ?? false;
  } catch {
    return false;
  }
}

export function dynamicIslandAvailable() {
  try {
    return native?.hasDynamicIsland?.() ?? false;
  } catch {
    return false;
  }
}

export async function windowGeometry(): Promise<WindowGeometry | null> {
  try {
    return (await native?.windowGeometry?.()) ?? null;
  } catch {
    return null;
  }
}

export async function startOrUpdatePrayerActivity(state: PrayerActivityState) {
  await native?.startOrUpdateActivity(state);
}

export async function endPrayerActivity() {
  await native?.endActivity();
}

export function readNativePrayerLog(): string | null {
  try {
    return native?.getPrayerLog() ?? null;
  } catch {
    return null;
  }
}

export function writeNativePrayerLog(log: unknown) {
  try {
    native?.setPrayerLog(JSON.stringify(log));
  } catch {
    return;
  }
}

export function setNativeNotificationQueue(queue: QueuedNotification[]) {
  try {
    native?.setNotificationQueue?.(JSON.stringify(queue));
  } catch {
    return;
  }
}

export function canScheduleExactAlarms(): boolean | null {
  try {
    return native?.canScheduleExactAlarms?.() ?? null;
  } catch {
    return null;
  }
}

export function isIgnoringBatteryOptimizations(): boolean | null {
  try {
    return native?.isIgnoringBatteryOptimizations?.() ?? null;
  } catch {
    return null;
  }
}

export function openSystemSettings(kind: SystemSettingsKind): boolean {
  if (!native?.openSystemSettings) return false;
  try {
    native.openSystemSettings(kind);
    return true;
  } catch {
    return false;
  }
}
