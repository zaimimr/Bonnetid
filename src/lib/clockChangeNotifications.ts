import { Platform } from 'react-native';
import type { ClockChangeReminder } from './clockChange';
import { hasNotificationPermission, notificationsSupported } from './notifications';
import { t } from './i18n.ts';

const IDENTIFIER_PREFIX = 'clockchange|';
const CHANNEL_ID = 'clock-change';

type NotificationsModule = typeof import('expo-notifications');

let modulePromise: Promise<NotificationsModule> | null = null;

function getNotifications(): Promise<NotificationsModule> {
  modulePromise ??= import('expo-notifications');
  return modulePromise;
}

export async function cancelClockChangeNotifications(): Promise<void> {
  if (!notificationsSupported) return;
  const Notifications = await getNotifications();
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const request of scheduled) {
    if (!request.identifier.startsWith(IDENTIFIER_PREFIX)) continue;
    await Notifications.cancelScheduledNotificationAsync(request.identifier);
  }
}

export async function scheduleClockChangeReminder(reminder: ClockChangeReminder): Promise<void> {
  if (!notificationsSupported) return;
  await cancelClockChangeNotifications();
  if (!(await hasNotificationPermission())) return;

  const Notifications = await getNotifications();
  let channelId: string | undefined;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: t('notifications.clockChange'),
      importance: Notifications.AndroidImportance.DEFAULT,
    });
    channelId = CHANNEL_ID;
  }

  await Notifications.scheduleNotificationAsync({
    identifier: `${IDENTIFIER_PREFIX}${reminder.eveIso}`,
    content: { title: reminder.title, body: reminder.body },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminder.fireAt,
      channelId,
    },
  });
}
