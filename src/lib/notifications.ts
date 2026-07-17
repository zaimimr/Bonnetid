import * as Notifications from 'expo-notifications';
import type { PrayerEntry } from './prayerSchedule';

const MAX_SCHEDULED = 40;

export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function cancelAllPrayerNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function schedulePrayerNotifications(
  entries: PrayerEntry[],
  locationName: string,
): Promise<number> {
  await cancelAllPrayerNotifications();

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
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: entry.date,
      },
    });
  }

  return upcoming.length;
}
