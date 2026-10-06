import { useEffect, useRef } from 'react';
import { Linking, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  Button,
  Card,
  Divider,
  EmptyState,
  ListRow,
  Screen,
  SectionHeader,
  Skeleton,
} from '@/components/ui';
import { useNotificationHealth } from '@/hooks/useNotificationHealth';
import { formatGregorianShort } from '@/lib/hijri';
import { notificationsSupported, requestNotificationPermission } from '@/lib/notifications';
import type { NotificationIssue, NotificationIssueKey } from '@/lib/notificationHealth';
import { PRAYER_LABELS, type PrayerName } from '@/lib/prayerSchedule';
import { track } from '@/lib/telemetry';
import { formatLocalClock } from '@/lib/time';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';
import { openSystemSettings, type SystemSettingsKind } from '../../modules/prayer-widget';
import { t } from '@/lib/i18n';

const ROW = { paddingHorizontal: spacing.md } as const;

const FIX_LABEL = t({ nb: 'Fiks', en: 'Fix', ar: 'إصلاح', ur: 'ٹھیک کریں' });
const ALLOWED = t({ nb: 'Tillatt', en: 'Allowed', ar: 'مسموح', ur: 'اجازت ہے' });
const NOT_ALLOWED = t({ nb: 'Ikke tillatt', en: 'Not allowed', ar: 'غير مسموح', ur: 'اجازت نہیں' });
const ON = t({ nb: 'På', en: 'On', ar: 'مفعّل', ur: 'آن' });
const OFF = t({ nb: 'Av', en: 'Off', ar: 'متوقف', ur: 'آف' });

function openSettings(kind: SystemSettingsKind) {
  if (!openSystemSettings(kind)) Linking.openSettings().catch(() => {});
}

function prayerLabel(prayer: string): string {
  return PRAYER_LABELS[prayer as PrayerName] ?? prayer;
}

function dayOf(isoDate: string): Date {
  return new Date(`${isoDate}T12:00:00`);
}

export default function NotificationCheckScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { status, issues, next, delivered, refresh } = useNotificationHealth();
  const tracked = useRef(false);

  useEffect(() => {
    if (!status || tracked.current) return;
    tracked.current = true;
    track('notification_check_opened', {
      issues: issues.map((issue) => issue.key).join(',') || 'none',
    });
  }, [status, issues]);

  if (!notificationsSupported) {
    return (
      <Screen edges={[]}>
        <EmptyState message={t({ nb: 'Ikke tilgjengelig i Expo Go på Android', en: 'Not available in Expo Go on Android', ar: 'غير متاح في Expo Go على أندرويد', ur: 'اینڈرائیڈ پر Expo Go میں دستیاب نہیں' })} icon="notifications-off-outline" />
      </Screen>
    );
  }

  if (!status) {
    return (
      <Screen scroll edges={[]}>
        <Skeleton height={240} rounded="xl" style={{ marginTop: spacing.lg }} />
      </Screen>
    );
  }

  if (!status.enabled) {
    return (
      <Screen edges={[]}>
        <EmptyState message={t({ nb: 'Varsler er slått av', en: 'Notifications are turned off', ar: 'الإشعارات متوقفة', ur: 'اطلاعات بند ہیں' })} icon="notifications-off-outline" />
      </Screen>
    );
  }

  const find = (...keys: NotificationIssueKey[]) =>
    issues.find((issue) => keys.includes(issue.key)) ?? null;

  const fix = (key: NotificationIssueKey, action: () => void | Promise<void>) => async () => {
    track('notification_check_fix_tapped', { issue: key });
    await action();
    refresh();
  };

  const fixPermission = async () => {
    const granted = await requestNotificationPermission();
    if (!granted || status.channelBlocked) openSettings('notifications');
  };

  const icon = (issue: NotificationIssue | null) =>
    issue == null ? (
      <Ionicons name="checkmark-circle" size={22} color={theme.colors.success} />
    ) : issue.severity === 'broken' ? (
      <Ionicons name="alert-circle" size={22} color={theme.colors.danger} />
    ) : (
      <Ionicons name="information-circle" size={22} color={theme.colors.notice} />
    );

  const fixButton = (issue: NotificationIssue | null, label: string, action: () => void | Promise<void>) =>
    issue ? <Button label={label} size="sm" variant="secondary" onPress={fix(issue.key, action)} /> : undefined;

  const permissionIssue = find('permission', 'channel');
  const queueIssue = find('emptyQueue', 'noPrayers');

  return (
    <Screen scroll edges={[]}>
      <SectionHeader title={t({ nb: 'Status', en: 'Status', ar: 'الحالة', ur: 'صورتحال' })} style={{ marginTop: spacing.lg }} />
      <Card padding="sm" rounded="xl">
        <ListRow
          title={t({ nb: 'Varsler', en: 'Notifications', ar: 'الإشعارات', ur: 'اطلاعات' })}
          subtitle={
            !status.permissionGranted
              ? NOT_ALLOWED
              : status.channelBlocked
                ? t({ nb: 'Slått av for bønnevarsler', en: 'Turned off for prayer notifications', ar: 'متوقفة لإشعارات الصلاة', ur: 'نماز کی اطلاعات کے لیے بند' })
                : ALLOWED
          }
          leading={icon(permissionIssue)}
          trailing={fixButton(permissionIssue, FIX_LABEL, fixPermission)}
          style={ROW}
        />
        {status.soundAllowed != null && (
          <>
            <Divider />
            <ListRow
              title={t({ nb: 'Lyd', en: 'Sound', ar: 'الصوت', ur: 'آواز' })}
              subtitle={status.soundAllowed ? ON : OFF}
              leading={icon(find('sound'))}
              trailing={fixButton(find('sound'), FIX_LABEL, () => openSettings('notifications'))}
              style={ROW}
            />
          </>
        )}
        {status.exactAlarmsAllowed != null && (
          <>
            <Divider />
            <ListRow
              title={t({ nb: 'Alarmer og påminnelser', en: 'Alarms and reminders', ar: 'المنبهات والتذكيرات', ur: 'الارم اور یاد دہانیاں' })}
              subtitle={status.exactAlarmsAllowed ? ALLOWED : NOT_ALLOWED}
              leading={icon(find('exactAlarm'))}
              trailing={fixButton(find('exactAlarm'), FIX_LABEL, () => openSettings('exactAlarm'))}
              style={ROW}
            />
          </>
        )}
        {status.batteryOptimized != null && (
          <>
            <Divider />
            <ListRow
              title={t({ nb: 'Batterisparing', en: 'Battery saver', ar: 'توفير البطارية', ur: 'بیٹری سیور' })}
              subtitle={status.batteryOptimized ? ON : OFF}
              leading={icon(find('battery'))}
              trailing={fixButton(find('battery'), t({ nb: 'Slå av', en: 'Turn off', ar: 'إيقاف', ur: 'بند کریں' }), () => openSettings('battery'))}
              style={ROW}
            />
          </>
        )}
        <Divider />
        <ListRow
          title={t({ nb: 'Planlagte varsler', en: 'Scheduled notifications', ar: 'الإشعارات المجدولة', ur: 'طے شدہ اطلاعات' })}
          subtitle={
            next
              ? t({
                  nb: `${status.scheduledAdhans} · neste ${next.title}, ${formatGregorianShort(dayOf(next.isoDate))}`,
                  en: `${status.scheduledAdhans} · next ${next.title}, ${formatGregorianShort(dayOf(next.isoDate))}`,
                  ar: `${status.scheduledAdhans} · التالي ${next.title}، ${formatGregorianShort(dayOf(next.isoDate))}`,
                  ur: `${status.scheduledAdhans} · اگلی ${next.title}، ${formatGregorianShort(dayOf(next.isoDate))}`,
                })
              : `${status.scheduledAdhans}`
          }
          leading={icon(queueIssue)}
          trailing={
            queueIssue?.key === 'noPrayers'
              ? fixButton(queueIssue, t({ nb: 'Velg', en: 'Choose', ar: 'اختر', ur: 'منتخب کریں' }), () => router.push('/notification-prayers'))
              : fixButton(queueIssue, t({ nb: 'Meld fra', en: 'Report', ar: 'إبلاغ', ur: 'اطلاع دیں' }), () => router.push('/feedback'))
          }
          style={ROW}
        />
      </Card>

      <SectionHeader title={t({ nb: 'Siste varsler', en: 'Recent notifications', ar: 'أحدث الإشعارات', ur: 'حالیہ اطلاعات' })} style={{ marginTop: spacing.lg }} />
      <Card padding="sm" rounded="xl">
        {delivered.length === 0 ? (
          <ListRow title={t({ nb: 'Ingen i varslingssenteret', en: 'None in Notification Center', ar: 'لا شيء في مركز الإشعارات', ur: 'اطلاعاتی مرکز میں کوئی نہیں' })} style={ROW} />
        ) : (
          delivered.map((item, index) => {
            const at = new Date(item.deliveredAt);
            return (
              <View key={`${item.isoDate}|${item.prayer}|${item.deliveredAt}`}>
                {index > 0 && <Divider />}
                <ListRow
                  title={prayerLabel(item.prayer)}
                  subtitle={t({
                    nb: `${formatGregorianShort(at)} kl. ${formatLocalClock(at)}`,
                    en: `${formatGregorianShort(at)} at ${formatLocalClock(at)}`,
                    ar: `${formatGregorianShort(at)} الساعة ${formatLocalClock(at)}`,
                    ur: `${formatGregorianShort(at)}، ${formatLocalClock(at)} بجے`,
                  })}
                  leading={
                    <Ionicons name="notifications-outline" size={20} color={theme.colors.primary} />
                  }
                  style={ROW}
                />
              </View>
            );
          })
        )}
      </Card>
    </Screen>
  );
}
