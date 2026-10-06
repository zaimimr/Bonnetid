import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, Divider, ListRow, Toggle } from '@/components/ui';
import { NotificationPreview } from '@/components/settings/NotificationPreview';
import { ROW, SettingsPage } from '@/components/settings/shared';
import { useTheme } from '@/theme';
import { notificationsSupported, requestNotificationPermission } from '@/lib/notifications';
import { getNotificationSound } from '@/lib/notificationSounds';
import { PRAYER_LABELS } from '@/lib/prayerSchedule';
import { track } from '@/lib/telemetry';
import { useFeature } from '@/hooks/useFeature';
import { NOTIFIABLE_PRAYERS, VOLUNTARY_FAST_KINDS, useSettings } from '@/store/settings';
import { t } from '@/lib/i18n';

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const notificationsEnabled = useSettings((state) => state.notificationsEnabled);
  const setNotificationsEnabled = useSettings((state) => state.setNotificationsEnabled);
  const notificationSound = useSettings((state) => state.notificationSound);
  const notificationPrayers = useSettings((state) => state.notificationPrayers);
  const endReminderEnabled = useSettings((state) => state.endReminderEnabled);
  const setEndReminderEnabled = useSettings((state) => state.setEndReminderEnabled);
  const trackerAllowed = useFeature('prayer-tracker');
  const trackerEnabled = useSettings((state) => state.prayerTrackerEnabled) && trackerAllowed;
  const ramadanRemindersEnabled = useSettings((state) => state.ramadanRemindersEnabled);
  const dhulHijjahRemindersEnabled = useSettings((state) => state.dhulHijjahRemindersEnabled);
  const voluntaryFasts = useSettings((state) => state.voluntaryFasts);

  const toggleNotifications = async (value: boolean) => {
    if (!value) {
      setNotificationsEnabled(false);
      track('notifications_toggled', { enabled: false });
      return;
    }
    const granted = await requestNotificationPermission();
    setNotificationsEnabled(granted);
    track('notifications_toggled', { enabled: granted });
  };

  const chosenFasts = [
    ramadanRemindersEnabled,
    dhulHijjahRemindersEnabled,
    ...VOLUNTARY_FAST_KINDS.map((kind) => voluntaryFasts[kind]),
  ].filter(Boolean).length;
  const fastingSummary =
    chosenFasts === 0
      ? t('settings.noReminders')
      : chosenFasts === 1
        ? t('settings.n1ReminderIsOn')
        : t('settings.remindersAreOn', { chosenFasts });

  const chosenPrayers = NOTIFIABLE_PRAYERS.filter((prayer) => notificationPrayers[prayer]);
  const prayerSummary =
    chosenPrayers.length === NOTIFIABLE_PRAYERS.length
      ? t('settings.allPrayers')
      : chosenPrayers.length === 0
        ? t('settings.noneSelected')
        : chosenPrayers.map((prayer) => PRAYER_LABELS[prayer]).join(t('settings.separator'));

  return (
    <SettingsPage>
      <NotificationPreview enabled={notificationsEnabled} />

      <Card padding="sm" rounded="xl">
        <ListRow
          title={t('settings.turnOnNotifications')}
          subtitle={notificationsSupported ? undefined : t('settings.notAvailableInExpo')}
          leading={<Ionicons name="notifications-outline" size={20} color={theme.colors.primary} />}
          trailing={
            <Toggle
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              disabled={!notificationsSupported}
            />
          }
          style={ROW}
        />
      </Card>

      {notificationsEnabled && (
        <Card padding="sm" rounded="xl">
          <ListRow
            title={t('settings.prayerNotifications')}
            subtitle={`${prayerSummary} · ${getNotificationSound(notificationSound).label}`}
            leading={<Ionicons name="time-outline" size={20} color={theme.colors.primary} />}
            chevron
            onPress={() => router.push('/notification-prayers')}
            style={ROW}
          />
          <Divider />
          <ListRow
            title={t('settings.fastingAndSpecialDays')}
            subtitle={fastingSummary}
            leading={<Ionicons name="moon-outline" size={20} color={theme.colors.primary} />}
            chevron
            onPress={() => router.push('/fasting-reminders')}
            style={ROW}
          />
          <Divider />
          <ListRow
            title={t('settings.reminderBeforeTimeRuns')}
            subtitle={
              trackerEnabled
                ? t('settings.n30MinutesBeforeIf')
                : t('settings.n30MinutesBefore')
            }
            leading={<Ionicons name="hourglass-outline" size={20} color={theme.colors.primary} />}
            trailing={<Toggle value={endReminderEnabled} onValueChange={setEndReminderEnabled} />}
            style={ROW}
          />
        </Card>
      )}

      {notificationsEnabled && (
        <Card padding="sm" rounded="xl">
          <ListRow
            title={t('settings.notificationCheck')}
            leading={<Ionicons name="pulse-outline" size={20} color={theme.colors.primary} />}
            chevron
            onPress={() => router.push('/notification-check')}
            style={ROW}
          />
        </Card>
      )}
    </SettingsPage>
  );
}
