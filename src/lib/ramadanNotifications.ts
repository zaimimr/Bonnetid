import { Platform } from 'react-native';
import { notificationsSupported, hasNotificationPermission } from './notifications';
import { SUHOOR_REMINDER_MINUTES } from './ramadan';

export const RAMADAN_IDENTIFIER_PREFIX = 'ramadan|';

const MAX_SCHEDULED = 10;
const CHANNEL_ID = 'ramadan-suhoor';
const MINUTE_MS = 60_000;

type NotificationsModule = typeof import('expo-notifications');

let modulePromise: Promise<NotificationsModule> | null = null;

function getNotifications(): Promise<NotificationsModule> {
  modulePromise ??= import('expo-notifications');
  return modulePromise;
}

export type SuhoorReminder = {
  isoDate: string;
  dayOfRamadan: number;
  fajrAt: Date;
  fajrClock: string;
};

export function suhoorReminderAt(fajrAt: Date): Date {
  return new Date(fajrAt.getTime() - SUHOOR_REMINDER_MINUTES * MINUTE_MS);
}

export function pendingSuhoorReminders(reminders: SuhoorReminder[], now: Date): SuhoorReminder[] {
  return reminders
    .filter((reminder) => suhoorReminderAt(reminder.fajrAt).getTime() > now.getTime())
    .sort((a, b) => a.fajrAt.getTime() - b.fajrAt.getTime())
    .slice(0, MAX_SCHEDULED);
}

export async function cancelRamadanNotifications(): Promise<void> {
  if (!notificationsSupported) return;
  const Notifications = await getNotifications();
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const request of scheduled) {
    if (!request.identifier.startsWith(RAMADAN_IDENTIFIER_PREFIX)) continue;
    await Notifications.cancelScheduledNotificationAsync(request.identifier);
  }
}

async function ensureAndroidChannel(Notifications: NotificationsModule): Promise<string | undefined> {
  if (Platform.OS !== 'android') return undefined;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Ramadan',
    importance: Notifications.AndroidImportance.HIGH,
  });
  return CHANNEL_ID;
}

export async function scheduleSuhoorReminders(
  reminders: SuhoorReminder[],
  locationName: string,
  now: Date = new Date(),
): Promise<number> {
  if (!notificationsSupported) return 0;

  const upcoming = pendingSuhoorReminders(reminders, now);
  if (upcoming.length === 0) {
    await cancelRamadanNotifications();
    return 0;
  }

  const granted = await hasNotificationPermission();
  if (!granted) {
    await cancelRamadanNotifications();
    return 0;
  }

  const Notifications = await getNotifications();
  await cancelRamadanNotifications();
  const channelId = await ensureAndroidChannel(Notifications);

  for (const reminder of upcoming) {
    await Notifications.scheduleNotificationAsync({
      identifier: `${RAMADAN_IDENTIFIER_PREFIX}suhoor|${reminder.isoDate}`,
      content: {
        title: `Suhoor slutter om ${SUHOOR_REMINDER_MINUTES} minutter`,
        body: `Fajr er ${reminder.fajrClock} i ${locationName}. Ramadan dag ${reminder.dayOfRamadan}.`,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: suhoorReminderAt(reminder.fajrAt),
        channelId,
      },
    });
  }

  return upcoming.length;
}
