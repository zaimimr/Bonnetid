import { test } from 'node:test';
import assert from 'node:assert/strict';
import { migrateSettings } from './settingsMigration.ts';

test('fills new fields for an upgrading user', () => {
  const out = migrateSettings({ onboardingDone: true, reviewRequested: false }, '1.8.0');
  assert.deepEqual(out.activeDays, []);
  assert.equal(out.mosqueSelectedOn, null);
  assert.equal(out.reviewRequestedAt, null);
  assert.equal(out.analyticsEnabled, true);
  assert.equal(out.lastSeenWhatsNew, '1.8.0');
  assert.deepEqual(out.seenSurveys, []);
  assert.equal(out.supportTicketId, null);
});

test('earlier review request becomes a dated request with unknown version', () => {
  const before = Date.now();
  const out = migrateSettings({ onboardingDone: true, reviewRequested: true }, '1.8.0');
  assert.ok((out.reviewRequestedAt as number) >= before);
  assert.equal(out.reviewRequestedVersion, null);
});

test('keeps values that already exist', () => {
  const out = migrateSettings({ analyticsEnabled: false, lastSeenWhatsNew: '1.9.0', activeDays: ['2026-10-01'] }, '1.8.0');
  assert.equal(out.analyticsEnabled, false);
  assert.equal(out.lastSeenWhatsNew, '1.9.0');
  assert.deepEqual(out.activeDays, ['2026-10-01']);
});
