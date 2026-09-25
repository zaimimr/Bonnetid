import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import type { PrayerEntry } from './prayerSchedule';
import type { PrayerStatus } from './prayerLog';
import { reminderBody, reminderTitle, type PrayerReminder } from './prayerReminders';
import {
  NOTIFICATION_SOUNDS,
  getNotificationSound,
  type NotificationSoundKey,
  type NotificationSoundOption,
} from './notificationSounds';
import { track } from './telemetry';

const MAX_SCHEDULED = Platform.OS === 'ios' ? 50 : 150;
const REMINDER_HORIZON_MS = 48 * 60 * 60 * 1000;

const PRAYER_PREFIX = 'prayer|';
const REMINDER_PREFIX = 'reminder|';
const OWNED_PREFIXES = [PRAYER_PREFIX, REMINDER_PREFIX];

export const PRAYER_CATEGORY = 'prayer';
export const MARK_PRAYED_ACTION = 'prayed';
export const MARK_SKIPPED_ACTION = 'skipped';

const REMINDER_CHANNEL_ID = 'prayer-reminder';
const ADHAN_CHANNEL_GENERATION = 2;
const LEGACY_ADHAN_CHANNEL_IDS = NOTIFICATION_SOUNDS.map((sound) => `prayer-${sound.key}`);

export const notificationsSupported = !(
  Platform.OS === 'android' && Constants.executionEnvironment === ExecutionEnvironment.StoreClient
);

type NotificationsModule = typeof import('expo-notifications');

let modulePromise: Promise<NotificationsModule> | null = null;

function getNotifications(): Promise<NotificationsModule> {
  modulePromise ??= import('expo-notifications');
  return modulePromise;
}

export function prayerNotificationId(isoDate: string, prayer: string): string {
  return `${PRAYER_PREFIX}${isoDate}|${prayer}`;
}

export function reminderNotificationId(isoDate: string, prayer: string): string {
  return `${REMINDER_PREFIX}${isoDate}|${prayer}`;
}

function isOwned(identifier: string): boolean {
  return OWNED_PREFIXES.some((prefix) => identifier.startsWith(prefix));
}

export function configureNotificationHandler() {
  if (!notificationsSupported) return;
  getNotifications()
    .then((Notifications) =>
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      }),
    )
    .catch(() => {});
}

export async function hasNotificationPermission(): Promise<boolean> {
  if (!notificationsSupported) return false;
  const Notifications = await getNotifications();
  const current = await Notifications.getPermissionsAsync();
  return current.granted;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!notificationsSupported) return false;
  const Notifications = await getNotifications();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

const syncedSignatures = new Map<string, string>();

let categoryRegistered = false;

async function ensurePrayerCategory(Notifications: NotificationsModule) {
  if (categoryRegistered) return;
  await Notifications.setNotificationCategoryAsync(PRAYER_CATEGORY, [
    {
      identifier: MARK_PRAYED_ACTION,
      buttonTitle: 'Bedt',
      options: { opensAppToForeground: false },
    },
    {
      identifier: MARK_SKIPPED_ACTION,
      buttonTitle: 'Hopp over',
      options: { opensAppToForeground: false },
    },
  ]);
  categoryRegistered = true;
}

let legacyChannelsRemoved = false;

async function removeLegacyAdhanChannels(Notifications: NotificationsModule) {
  if (legacyChannelsRemoved) return;
  legacyChannelsRemoved = true;
  const channels = await Notifications.getNotificationChannelsAsync();
  for (const channel of channels) {
    if (!LEGACY_ADHAN_CHANNEL_IDS.includes(channel.id)) continue;
    await Notifications.deleteNotificationChannelAsync(channel.id);
  }
}

function channelSoundMatches(
  channelSound: 'default' | 'custom' | null,
  sound: NotificationSoundOption,
): boolean {
  return sound.fileName ? channelSound === 'custom' : channelSound !== null;
}

async function ensureAdhanChannel(
  Notifications: NotificationsModule,
  soundKey: NotificationSoundKey,
): Promise<string | undefined> {
  if (Platform.OS !== 'android') return undefined;
  const sound = getNotificationSound(soundKey);
  const channelId = `prayer-${sound.key}-v${ADHAN_CHANNEL_GENERATION}`;
  await removeLegacyAdhanChannels(Notifications);
  const channel = await Notifications.setNotificationChannelAsync(channelId, {
    name: `Bønnetid (${sound.label})`,
    importance: Notifications.AndroidImportance.HIGH,
    sound: sound.fileName ?? undefined,
    audioAttributes: {
      usage: Notifications.AndroidAudioUsage.NOTIFICATION,
      contentType: Notifications.AndroidAudioContentType.SONIFICATION,
    },
  });
  if (channel && !channelSoundMatches(channel.sound, sound)) {
    track('notification_channel_sound_mismatch', {
      channelId,
      expected: sound.fileName ?? 'default',
      actual: channel.sound ?? 'null',
    });
  }
  return channelId;
}

async function ensureReminderChannel(
  Notifications: NotificationsModule,
): Promise<string | undefined> {
  if (Platform.OS !== 'android') return undefined;
  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name: 'Påminnelser',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
  return REMINDER_CHANNEL_ID;
}

type InterruptionLevel = 'active' | 'timeSensitive';

type PlannedNotification = {
  identifier: string;
  title: string;
  body: string;
  date: Date;
  sound: string | boolean;
  interruptionLevel: InterruptionLevel;
  channelId: string | undefined;
  category: string | undefined;
  isoDate: string;
  prayer: string;
};

function signatureOf(item: PlannedNotification): string {
  return [
    item.date.getTime(),
    item.title,
    item.body,
    item.sound,
    item.interruptionLevel,
    item.channelId ?? '',
    item.category ?? '',
  ].join('|');
}

export type ScheduledPrayer = {
  isoDate: string;
  entry: PrayerEntry;
};

export type PrayerNotificationPlan = {
  adhan: ScheduledPrayer[];
  reminders: PrayerReminder[];
  locationName: string;
  soundKey: NotificationSoundKey;
  markActions: boolean;
};

let pending: Promise<unknown> = Promise.resolve();

function serialize<T>(task: () => Promise<T>): Promise<T> {
  const next = pending.then(task, task);
  pending = next.catch(() => {});
  return next;
}

export function syncPrayerNotifications(plan: PrayerNotificationPlan): Promise<number> {
  if (!notificationsSupported) return Promise.resolve(0);
  return serialize(() => runSync(plan));
}

async function runSync(plan: PrayerNotificationPlan): Promise<number> {
  const Notifications = await getNotifications();
  if (plan.markActions) await ensurePrayerCategory(Notifications);

  const sound = getNotificationSound(plan.soundKey);
  const adhanChannel = await ensureAdhanChannel(Notifications, plan.soundKey);
  const reminderChannel = plan.reminders.length > 0 ? await ensureReminderChannel(Notifications) : undefined;

  const seen = new Set<string>();
  const planned: PlannedNotification[] = [];

  for (const { isoDate, entry } of plan.adhan) {
    const identifier = prayerNotificationId(isoDate, entry.name);
    if (seen.has(identifier)) continue;
    seen.add(identifier);
    planned.push({
      identifier,
      title: `${entry.label} ${entry.time}`,
      body: `Det er tid for ${entry.label} i ${plan.locationName}.`,
      date: entry.date,
      sound: sound.fileName ?? true,
      interruptionLevel: 'timeSensitive',
      channelId: adhanChannel,
      category: plan.markActions ? PRAYER_CATEGORY : undefined,
      isoDate,
      prayer: entry.name,
    });
  }

  const reminderCutoff = Date.now() + REMINDER_HORIZON_MS;
  for (const reminder of plan.reminders) {
    if (reminder.fireAt.getTime() > reminderCutoff) continue;
    const identifier = reminderNotificationId(reminder.isoDate, reminder.prayer);
    if (seen.has(identifier)) continue;
    seen.add(identifier);
    planned.push({
      identifier,
      title: reminderTitle(reminder.label),
      body: reminderBody(reminder),
      date: reminder.fireAt,
      sound: true,
      interruptionLevel: 'active',
      channelId: reminderChannel,
      category: plan.markActions ? PRAYER_CATEGORY : undefined,
      isoDate: reminder.isoDate,
      prayer: reminder.prayer,
    });
  }

  const upcoming = planned
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, MAX_SCHEDULED);
  const wanted = new Map(upcoming.map((item) => [item.identifier, item]));

  const existing = await Notifications.getAllScheduledNotificationsAsync();
  const owned = new Set(
    existing.map((request) => request.identifier).filter((identifier) => isOwned(identifier)),
  );

  for (const identifier of owned) {
    if (wanted.has(identifier)) continue;
    await Notifications.cancelScheduledNotificationAsync(identifier);
    syncedSignatures.delete(identifier);
  }

  for (const item of upcoming) {
    const signature = signatureOf(item);
    if (owned.has(item.identifier) && syncedSignatures.get(item.identifier) === signature) continue;
    await Notifications.scheduleNotificationAsync({
      identifier: item.identifier,
      content: {
        title: item.title,
        body: item.body,
        sound: item.sound,
        interruptionLevel: item.interruptionLevel,
        categoryIdentifier: item.category,
        data: { isoDate: item.isoDate, prayer: item.prayer },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: item.date,
        channelId: item.channelId,
      },
    });
    syncedSignatures.set(item.identifier, signature);
  }

  return upcoming.length;
}

export function cancelPrayerNotifications(): Promise<void> {
  if (!notificationsSupported) return Promise.resolve();
  return serialize(async () => {
    const Notifications = await getNotifications();
    const existing = await Notifications.getAllScheduledNotificationsAsync();
    for (const request of existing) {
      if (!isOwned(request.identifier)) continue;
      await Notifications.cancelScheduledNotificationAsync(request.identifier);
      syncedSignatures.delete(request.identifier);
    }
  });
}

export function cancelPrayerReminder(isoDate: string, prayer: string): Promise<void> {
  if (!notificationsSupported) return Promise.resolve();
  return serialize(async () => {
    const identifier = reminderNotificationId(isoDate, prayer);
    const Notifications = await getNotifications();
    await Notifications.cancelScheduledNotificationAsync(identifier);
    syncedSignatures.delete(identifier);
  });
}

export type PrayerActionHandler = (
  isoDate: string,
  prayer: string,
  status: PrayerStatus,
  shownAt: number | null,
) => void;

const COLD_START_MAX_AGE_MS = 15 * 60 * 1000;
const SECONDS_SCALE_LIMIT = 1e12;

type NotificationResponseLike = {
  actionIdentifier: string;
  notification: { date?: number; request: { identifier: string; content: { data?: unknown } } };
};

const handledResponses = new Set<string>();

function readAction(response: NotificationResponseLike): {
  key: string;
  isoDate: string;
  prayer: string;
  status: PrayerStatus;
} | null {
  const status =
    response.actionIdentifier === MARK_PRAYED_ACTION
      ? 'prayed'
      : response.actionIdentifier === MARK_SKIPPED_ACTION
        ? 'skipped'
        : null;
  if (!status) return null;
  const data = response.notification.request.content.data as
    | { isoDate?: unknown; prayer?: unknown }
    | undefined;
  if (typeof data?.isoDate !== 'string' || typeof data?.prayer !== 'string') return null;
  return {
    key: `${response.notification.request.identifier}|${response.actionIdentifier}`,
    isoDate: data.isoDate,
    prayer: data.prayer,
    status,
  };
}

function applyResponse(response: NotificationResponseLike, handler: PrayerActionHandler) {
  const action = readAction(response);
  if (!action || handledResponses.has(action.key)) return;
  handledResponses.add(action.key);
  handler(action.isoDate, action.prayer, action.status, shownAtOf(response));
}

export async function addPrayerActionListener(
  handler: PrayerActionHandler,
): Promise<() => void> {
  if (!notificationsSupported) return () => {};
  const Notifications = await getNotifications();
  const subscription = Notifications.addNotificationResponseReceivedListener((response) =>
    applyResponse(response, handler),
  );
  return () => subscription.remove();
}

function shownAtOf(response: NotificationResponseLike): number | null {
  const raw = response.notification.date;
  if (typeof raw !== 'number' || Number.isNaN(raw)) return null;
  return raw < SECONDS_SCALE_LIMIT ? raw * 1000 : raw;
}

function shownRecently(response: NotificationResponseLike): boolean {
  const shownAt = shownAtOf(response);
  if (shownAt == null) return true;
  return Date.now() - shownAt <= COLD_START_MAX_AGE_MS;
}

export async function consumeLastPrayerAction(handler: PrayerActionHandler) {
  if (!notificationsSupported) return;
  const Notifications = await getNotifications();
  const response = await Notifications.getLastNotificationResponseAsync();
  if (response && shownRecently(response)) applyResponse(response, handler);
}
