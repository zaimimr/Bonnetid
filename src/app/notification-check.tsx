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

const ROW = { paddingHorizontal: spacing.md } as const;

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
        <EmptyState message="Ikke tilgjengelig i Expo Go på Android" icon="notifications-off-outline" />
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
        <EmptyState message="Varsler er slått av" icon="notifications-off-outline" />
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
      <SectionHeader title="Status" style={{ marginTop: spacing.lg }} />
      <Card padding="sm" rounded="xl">
        <ListRow
          title="Varsler"
          subtitle={
            !status.permissionGranted
              ? 'Ikke tillatt'
              : status.channelBlocked
                ? 'Slått av for bønnevarsler'
                : 'Tillatt'
          }
          leading={icon(permissionIssue)}
          trailing={fixButton(permissionIssue, 'Fiks', fixPermission)}
          style={ROW}
        />
        {status.soundAllowed != null && (
          <>
            <Divider />
            <ListRow
              title="Lyd"
              subtitle={status.soundAllowed ? 'På' : 'Av'}
              leading={icon(find('sound'))}
              trailing={fixButton(find('sound'), 'Fiks', () => openSettings('notifications'))}
              style={ROW}
            />
          </>
        )}
        {status.exactAlarmsAllowed != null && (
          <>
            <Divider />
            <ListRow
              title="Alarmer og påminnelser"
              subtitle={status.exactAlarmsAllowed ? 'Tillatt' : 'Ikke tillatt'}
              leading={icon(find('exactAlarm'))}
              trailing={fixButton(find('exactAlarm'), 'Fiks', () => openSettings('exactAlarm'))}
              style={ROW}
            />
          </>
        )}
        {status.batteryOptimized != null && (
          <>
            <Divider />
            <ListRow
              title="Batterisparing"
              subtitle={status.batteryOptimized ? 'På' : 'Av'}
              leading={icon(find('battery'))}
              trailing={fixButton(find('battery'), 'Slå av', () => openSettings('battery'))}
              style={ROW}
            />
          </>
        )}
        <Divider />
        <ListRow
          title="Planlagte varsler"
          subtitle={
            next
              ? `${status.scheduledAdhans} · neste ${next.title}, ${formatGregorianShort(dayOf(next.isoDate))}`
              : `${status.scheduledAdhans}`
          }
          leading={icon(queueIssue)}
          trailing={
            queueIssue?.key === 'noPrayers'
              ? fixButton(queueIssue, 'Velg', () => router.push('/notification-prayers'))
              : fixButton(queueIssue, 'Meld fra', () => router.push('/feedback'))
          }
          style={ROW}
        />
      </Card>

      <SectionHeader title="Siste varsler" style={{ marginTop: spacing.lg }} />
      <Card padding="sm" rounded="xl">
        {delivered.length === 0 ? (
          <ListRow title="Ingen i varslingssenteret" style={ROW} />
        ) : (
          delivered.map((item, index) => {
            const at = new Date(item.deliveredAt);
            return (
              <View key={`${item.isoDate}|${item.prayer}|${item.deliveredAt}`}>
                {index > 0 && <Divider />}
                <ListRow
                  title={prayerLabel(item.prayer)}
                  subtitle={`${formatGregorianShort(at)} kl. ${formatLocalClock(at)}`}
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
