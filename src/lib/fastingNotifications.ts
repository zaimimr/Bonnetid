import { Platform } from 'react-native';
import type { FastingReminder } from './fasting';
import { hasNotificationPermission, notificationsSupported } from './notifications';
import { t } from './i18n.ts';

export const FASTING_IDENTIFIER_PREFIX = 'fasting|';
export const LEGACY_RAMADAN_IDENTIFIER_PREFIX = 'ramadan|';
export const FASTING_POOL_LIMIT = 10;

const OWNED_PREFIXES = [FASTING_IDENTIFIER_PREFIX, LEGACY_RAMADAN_IDENTIFIER_PREFIX];
const CHANNEL_ID = 'fasting-reminder';

type NotificationsModule = typeof import('expo-notifications');

let modulePromise: Promise<NotificationsModule> | null = null;

function getNotifications(): Promise<NotificationsModule> {
  modulePromise ??= import('expo-notifications');
  return modulePromise;
}

function isOwned(identifier: string): boolean {
  return OWNED_PREFIXES.some((prefix) => identifier.startsWith(prefix));
}

export function fastingNotificationId(isoDate: string): string {
  return `${FASTING_IDENTIFIER_PREFIX}${isoDate}`;
}

export function pendingFastingReminders(
  reminders: FastingReminder[],
  now: Date,
  limit: number = FASTING_POOL_LIMIT,
): FastingReminder[] {
  const byIdentifier = new Map<string, FastingReminder>();
  for (const reminder of reminders) {
    const fireAt = reminder.fireAt.getTime();
    if (Number.isNaN(fireAt) || fireAt <= now.getTime()) continue;
    const identifier = fastingNotificationId(reminder.isoDate);
    if (byIdentifier.has(identifier)) continue;
    byIdentifier.set(identifier, reminder);
  }
  return [...byIdentifier.values()]
    .sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime())
    .slice(0, limit);
}

export async function cancelFastingNotifications(): Promise<void> {
  if (!notificationsSupported) return;
  const Notifications = await getNotifications();
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const request of scheduled) {
    if (!isOwned(request.identifier)) continue;
    await Notifications.cancelScheduledNotificationAsync(request.identifier);
  }
}

async function ensureAndroidChannel(
  Notifications: NotificationsModule,
): Promise<string | undefined> {
  if (Platform.OS !== 'android') return undefined;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: t({ nb: 'Faste', en: 'Fasting', ar: 'الصيام', ur: 'روزہ' }),
    importance: Notifications.AndroidImportance.HIGH,
  });
  return CHANNEL_ID;
}

export async function scheduleFastingReminders(
  reminders: FastingReminder[],
  now: Date = new Date(),
): Promise<number> {
  if (!notificationsSupported) return 0;

  const upcoming = pendingFastingReminders(reminders, now);
  if (upcoming.length === 0) {
    await cancelFastingNotifications();
    return 0;
  }

  const granted = await hasNotificationPermission();
  if (!granted) {
    await cancelFastingNotifications();
    return 0;
  }

  const Notifications = await getNotifications();
  await cancelFastingNotifications();
  const channelId = await ensureAndroidChannel(Notifications);

  for (const reminder of upcoming) {
    await Notifications.scheduleNotificationAsync({
      identifier: fastingNotificationId(reminder.isoDate),
      content: { title: reminder.title, body: reminder.body },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminder.fireAt,
        channelId,
      },
    });
  }

  return upcoming.length;
}
