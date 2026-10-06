import { t } from './i18n.ts';

export type NotificationHealthStatus = {
  enabled: boolean;
  permissionGranted: boolean;
  soundAllowed: boolean | null;
  channelBlocked: boolean | null;
  exactAlarmsAllowed: boolean | null;
  batteryOptimized: boolean | null;
  prayersSelected: number;
  scheduledAdhans: number;
};

export type NotificationIssueKey =
  | 'permission'
  | 'channel'
  | 'exactAlarm'
  | 'emptyQueue'
  | 'noPrayers'
  | 'sound'
  | 'battery';

export type NotificationIssue = {
  key: NotificationIssueKey;
  severity: 'broken' | 'advice';
};

export type ScheduledAdhan = {
  isoDate: string;
  prayer: string;
  title: string;
};

export type DeliveredAdhan = {
  isoDate: string;
  prayer: string;
  deliveredAt: number;
};

export const NOTIFICATION_ISSUE_LABELS: Record<NotificationIssueKey, string> = t('notifications.notificationIssueLabels', { returnObjects: true });

export function notificationIssues(status: NotificationHealthStatus): NotificationIssue[] {
  if (!status.enabled) return [];
  const issues: NotificationIssue[] = [];
  if (!status.permissionGranted) issues.push({ key: 'permission', severity: 'broken' });
  if (status.channelBlocked) issues.push({ key: 'channel', severity: 'broken' });
  if (status.exactAlarmsAllowed === false) issues.push({ key: 'exactAlarm', severity: 'broken' });
  if (status.prayersSelected === 0) {
    issues.push({ key: 'noPrayers', severity: 'advice' });
  } else if (status.permissionGranted && status.scheduledAdhans === 0) {
    issues.push({ key: 'emptyQueue', severity: 'broken' });
  }
  if (status.soundAllowed === false) issues.push({ key: 'sound', severity: 'advice' });
  if (status.batteryOptimized) issues.push({ key: 'battery', severity: 'advice' });
  return issues;
}

export function isBroken(issues: NotificationIssue[]): boolean {
  return issues.some((issue) => issue.severity === 'broken');
}

export function nextAdhan(
  scheduled: ScheduledAdhan[],
  order: readonly string[],
): ScheduledAdhan | null {
  const rank = (prayer: string) => {
    const index = order.indexOf(prayer);
    return index === -1 ? order.length : index;
  };
  const sorted = [...scheduled].sort(
    (a, b) => a.isoDate.localeCompare(b.isoDate) || rank(a.prayer) - rank(b.prayer),
  );
  return sorted[0] ?? null;
}

export function latestDelivered(delivered: DeliveredAdhan[], count = 3): DeliveredAdhan[] {
  return [...delivered].sort((a, b) => b.deliveredAt - a.deliveredAt).slice(0, count);
}
