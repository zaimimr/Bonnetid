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
      ? t({ nb: 'Ingen påminnelser', en: 'No reminders', ar: 'لا توجد تذكيرات', ur: 'کوئی یاد دہانی نہیں' })
      : chosenFasts === 1
        ? t({ nb: '1 påminnelse er på', en: '1 reminder is on', ar: 'التذكيرات المفعّلة: 1', ur: '1 یاد دہانی آن ہے' })
        : t({
            nb: `${chosenFasts} påminnelser er på`,
            en: `${chosenFasts} reminders are on`,
            ar: `التذكيرات المفعّلة: ${chosenFasts}`,
            ur: `${chosenFasts} یاد دہانیاں آن ہیں`,
          });

  const chosenPrayers = NOTIFIABLE_PRAYERS.filter((prayer) => notificationPrayers[prayer]);
  const prayerSummary =
    chosenPrayers.length === NOTIFIABLE_PRAYERS.length
      ? t({ nb: 'Alle bønner', en: 'All prayers', ar: 'كل الصلوات', ur: 'تمام نمازیں' })
      : chosenPrayers.length === 0
        ? t({ nb: 'Ingen valgt', en: 'None selected', ar: 'لم يُحدَّد شيء', ur: 'کوئی منتخب نہیں' })
        : chosenPrayers.map((prayer) => PRAYER_LABELS[prayer]).join(t({ nb: ', ', en: ', ', ar: '، ', ur: '، ' }));

  return (
    <SettingsPage>
      <NotificationPreview enabled={notificationsEnabled} />

      <Card padding="sm" rounded="xl">
        <ListRow
          title={t({ nb: 'Slå på varsler', en: 'Turn on notifications', ar: 'تفعيل الإشعارات', ur: 'اطلاعات آن کریں' })}
          subtitle={notificationsSupported ? undefined : t({ nb: 'Ikke tilgjengelig i Expo Go på Android', en: 'Not available in Expo Go on Android', ar: 'غير متاح في Expo Go على أندرويد', ur: 'اینڈرائیڈ پر Expo Go میں دستیاب نہیں' })}
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
            title={t({ nb: 'Bønnevarsler', en: 'Prayer notifications', ar: 'إشعارات الصلاة', ur: 'نماز کی اطلاعات' })}
            subtitle={`${prayerSummary} · ${getNotificationSound(notificationSound).label}`}
            leading={<Ionicons name="time-outline" size={20} color={theme.colors.primary} />}
            chevron
            onPress={() => router.push('/notification-prayers')}
            style={ROW}
          />
          <Divider />
          <ListRow
            title={t({ nb: 'Faste og merkedager', en: 'Fasting and special days', ar: 'الصيام والمناسبات', ur: 'روزے اور خاص دن' })}
            subtitle={fastingSummary}
            leading={<Ionicons name="moon-outline" size={20} color={theme.colors.primary} />}
            chevron
            onPress={() => router.push('/fasting-reminders')}
            style={ROW}
          />
          <Divider />
          <ListRow
            title={t({ nb: 'Påminnelse før tiden går ut', en: 'Reminder before time runs out', ar: 'تذكير قبل خروج الوقت', ur: 'وقت ختم ہونے سے پہلے یاد دہانی' })}
            subtitle={
              trackerEnabled
                ? t({ nb: '30 minutter før, hvis bønnen ikke er markert', en: '30 minutes before, if the prayer is not marked', ar: 'قبل 30 دقيقة، إذا لم تُعلَّم الصلاة', ur: '30 منٹ پہلے، اگر نماز نشان زد نہ ہو' })
                : t({ nb: '30 minutter før', en: '30 minutes before', ar: 'قبل 30 دقيقة', ur: '30 منٹ پہلے' })
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
            title={t({ nb: 'Varselsjekk', en: 'Notification check', ar: 'فحص الإشعارات', ur: 'اطلاعات کی جانچ' })}
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
