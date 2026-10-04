import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isBroken,
  latestDelivered,
  nextAdhan,
  notificationIssues,
  type NotificationHealthStatus,
} from './notificationHealth.ts';

const healthy: NotificationHealthStatus = {
  enabled: true,
  permissionGranted: true,
  soundAllowed: true,
  channelBlocked: false,
  exactAlarmsAllowed: true,
  batteryOptimized: false,
  prayersSelected: 5,
  scheduledAdhans: 40,
};

const keys = (status: NotificationHealthStatus) =>
  notificationIssues(status).map((issue) => issue.key);

test('healthy status has no issues', () => {
  assert.deepEqual(notificationIssues(healthy), []);
  assert.equal(isBroken(notificationIssues(healthy)), false);
});

test('disabled in app reports nothing', () => {
  assert.deepEqual(
    notificationIssues({ ...healthy, enabled: false, permissionGranted: false, scheduledAdhans: 0 }),
    [],
  );
});

test('missing permission is broken and hides the empty queue', () => {
  const issues = notificationIssues({ ...healthy, permissionGranted: false, scheduledAdhans: 0 });
  assert.deepEqual(issues, [{ key: 'permission', severity: 'broken' }]);
  assert.equal(isBroken(issues), true);
});

test('empty queue with permission is broken', () => {
  assert.deepEqual(keys({ ...healthy, scheduledAdhans: 0 }), ['emptyQueue']);
});

test('no prayers selected is advice, not an empty queue', () => {
  const issues = notificationIssues({ ...healthy, prayersSelected: 0, scheduledAdhans: 0 });
  assert.deepEqual(issues, [{ key: 'noPrayers', severity: 'advice' }]);
  assert.equal(isBroken(issues), false);
});

test('android blockers are broken', () => {
  assert.deepEqual(keys({ ...healthy, channelBlocked: true, exactAlarmsAllowed: false }), [
    'channel',
    'exactAlarm',
  ]);
});

test('unknown native values are not issues', () => {
  assert.deepEqual(
    keys({
      ...healthy,
      soundAllowed: null,
      channelBlocked: null,
      exactAlarmsAllowed: null,
      batteryOptimized: null,
    }),
    [],
  );
});

test('sound off and battery optimisation are advice only', () => {
  const issues = notificationIssues({ ...healthy, soundAllowed: false, batteryOptimized: true });
  assert.deepEqual(
    issues.map((issue) => issue.key),
    ['sound', 'battery'],
  );
  assert.equal(isBroken(issues), false);
});

test('next adhan sorts by day then prayer order', () => {
  const order = ['fajr', 'duhr', 'asr', 'maghrib', 'isha'];
  const next = nextAdhan(
    [
      { isoDate: '2026-10-05', prayer: 'fajr', title: 'Fajr 05:40' },
      { isoDate: '2026-10-04', prayer: 'isha', title: 'Isha 20:30' },
      { isoDate: '2026-10-04', prayer: 'maghrib', title: 'Maghrib 18:50' },
    ],
    order,
  );
  assert.equal(next?.title, 'Maghrib 18:50');
  assert.equal(nextAdhan([], order), null);
});

test('latest delivered keeps the newest three', () => {
  const delivered = [1, 5, 3, 4, 2].map((deliveredAt) => ({
    isoDate: '2026-10-04',
    prayer: 'asr',
    deliveredAt,
  }));
  assert.deepEqual(
    latestDelivered(delivered).map((item) => item.deliveredAt),
    [5, 4, 3],
  );
});
