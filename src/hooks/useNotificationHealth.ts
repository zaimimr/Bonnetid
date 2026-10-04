import { useCallback, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  canScheduleExactAlarms,
  isIgnoringBatteryOptimizations,
} from '../../modules/prayer-widget';
import { readNotificationSystemState, type NotificationSystemState } from '@/lib/notifications';
import {
  latestDelivered,
  nextAdhan,
  notificationIssues,
  type NotificationHealthStatus,
} from '@/lib/notificationHealth';
import { NOTIFIABLE_PRAYERS, useSettings } from '@/store/settings';

function readStatus(system: NotificationSystemState): NotificationHealthStatus {
  const { notificationsEnabled, notificationPrayers } = useSettings.getState();
  const ignoring = isIgnoringBatteryOptimizations();
  return {
    enabled: notificationsEnabled,
    permissionGranted: system.permissionGranted,
    soundAllowed: system.soundAllowed,
    channelBlocked: system.channelBlocked,
    exactAlarmsAllowed: canScheduleExactAlarms(),
    batteryOptimized: ignoring == null ? null : !ignoring,
    prayersSelected: NOTIFIABLE_PRAYERS.filter((prayer) => notificationPrayers[prayer]).length,
    scheduledAdhans: system.scheduled.length,
  };
}

type Health = {
  system: NotificationSystemState;
  status: NotificationHealthStatus;
};

export function useNotificationHealth() {
  const soundKey = useSettings((state) => state.notificationSound);
  const [health, setHealth] = useState<Health | null>(null);

  const load = useCallback(
    (isActive: () => boolean = () => true) => {
      readNotificationSystemState(soundKey)
        .then((next) => {
          if (isActive() && next) setHealth({ system: next, status: readStatus(next) });
        })
        .catch(() => {});
    },
    [soundKey],
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const reload = () => load(() => active);
      reload();
      const subscription = AppState.addEventListener('change', (state) => {
        if (state === 'active') reload();
      });
      return () => {
        active = false;
        subscription.remove();
      };
    }, [load]),
  );

  return {
    status: health?.status ?? null,
    issues: health ? notificationIssues(health.status) : [],
    next: health ? nextAdhan(health.system.scheduled, NOTIFIABLE_PRAYERS) : null,
    delivered: health ? latestDelivered(health.system.delivered) : [],
    refresh: load,
  };
}
