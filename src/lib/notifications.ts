import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import type { PrayerEntry } from './prayerSchedule';
import { getNotificationSound, type NotificationSoundKey } from './notificationSounds';

const MAX_SCHEDULED = 40;

export const notificationsSupported = !(
  Platform.OS === 'android' && Constants.executionEnvironment === ExecutionEnvironment.StoreClient
);

type NotificationsModule = typeof import('expo-notifications');

let modulePromise: Promise<NotificationsModule> | null = null;

function getNotifications(): Promise<NotificationsModule> {
  modulePromise ??= import('expo-notifications');
  return modulePromise;
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

export async function requestNotificationPermission(): Promise<boolean> {
  if (!notificationsSupported) return false;
  const Notifications = await getNotifications();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function cancelAllPrayerNotifications() {
  if (!notificationsSupported) return;
  const Notifications = await getNotifications();
  await Notifications.cancelAllScheduledNotificationsAsync();
}

async function ensureAndroidChannel(
  Notifications: NotificationsModule,
  soundKey: NotificationSoundKey,
): Promise<string | undefined> {
  if (Platform.OS !== 'android') return undefined;
  const sound = getNotificationSound(soundKey);
  const channelId = `prayer-${sound.key}`;
  await Notifications.setNotificationChannelAsync(channelId, {
    name: `Bønnetid (${sound.label})`,
    importance: Notifications.AndroidImportance.HIGH,
    sound: sound.fileName ?? undefined,
  });
  return channelId;
}

export async function schedulePrayerNotifications(
  entries: PrayerEntry[],
  locationName: string,
  soundKey: NotificationSoundKey,
): Promise<number> {
  if (!notificationsSupported) return 0;
  const Notifications = await getNotifications();
  await cancelAllPrayerNotifications();

  const sound = getNotificationSound(soundKey);
  const channelId = await ensureAndroidChannel(Notifications, soundKey);

  const now = Date.now();
  const upcoming = entries
    .filter((entry) => entry.isPrayer && entry.date.getTime() > now)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, MAX_SCHEDULED);

  for (const entry of upcoming) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${entry.label} ${entry.time}`,
        body: `Det er tid for ${entry.label} i ${locationName}.`,
        sound: sound.fileName ?? true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: entry.date,
        channelId,
      },
    });
  }

  return upcoming.length;
}
