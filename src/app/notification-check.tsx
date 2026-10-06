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

const FIX_LABEL = t('settings.fix');
const ALLOWED = t('settings.allowed');
const NOT_ALLOWED = t('settings.notAllowed');
const ON = t('settings.on');
const OFF = t('settings.off');

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
        <EmptyState message={t('settings.notAvailableInExpo')} icon="notifications-off-outline" />
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
        <EmptyState message={t('settings.notificationsAreTurnedOff')} icon="notifications-off-outline" />
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
      <SectionHeader title={t('settings.status')} style={{ marginTop: spacing.lg }} />
      <Card padding="sm" rounded="xl">
        <ListRow
          title={t('settings.notifications')}
          subtitle={
            !status.permissionGranted
              ? NOT_ALLOWED
              : status.channelBlocked
                ? t('settings.turnedOffForPrayer')
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
              title={t('settings.sound')}
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
              title={t('settings.alarmsAndReminders')}
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
              title={t('settings.batterySaver')}
              subtitle={status.batteryOptimized ? ON : OFF}
              leading={icon(find('battery'))}
              trailing={fixButton(find('battery'), t('settings.turnOff'), () => openSettings('battery'))}
              style={ROW}
            />
          </>
        )}
        <Divider />
        <ListRow
          title={t('settings.scheduledNotifications')}
          subtitle={
            next
              ? t('settings.next', { scheduledAdhans: status.scheduledAdhans, title: next.title, value: formatGregorianShort(dayOf(next.isoDate)) })
              : `${status.scheduledAdhans}`
          }
          leading={icon(queueIssue)}
          trailing={
            queueIssue?.key === 'noPrayers'
              ? fixButton(queueIssue, t('settings.choose'), () => router.push('/notification-prayers'))
              : fixButton(queueIssue, t('settings.report'), () => router.push('/feedback'))
          }
          style={ROW}
        />
      </Card>

      <SectionHeader title={t('settings.recentNotifications')} style={{ marginTop: spacing.lg }} />
      <Card padding="sm" rounded="xl">
        {delivered.length === 0 ? (
          <ListRow title={t('settings.noneInNotificationCenter')} style={ROW} />
        ) : (
          delivered.map((item, index) => {
            const at = new Date(item.deliveredAt);
            return (
              <View key={`${item.isoDate}|${item.prayer}|${item.deliveredAt}`}>
                {index > 0 && <Divider />}
                <ListRow
                  title={prayerLabel(item.prayer)}
                  subtitle={t('settings.at', { date: formatGregorianShort(at), time: formatLocalClock(at) })}
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
