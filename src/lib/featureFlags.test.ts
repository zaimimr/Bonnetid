import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FEATURE_FLAGS, flagEnabled } from './featureFlags.ts';

test('unknown flag value means enabled', () => {
  assert.equal(flagEnabled(undefined), true);
});

test('explicit false disables', () => {
  assert.equal(flagEnabled(false), false);
});

test('true and variant strings enable', () => {
  assert.equal(flagEnabled(true), true);
  assert.equal(flagEnabled('control'), true);
});

test('flag list matches PostHog keys', () => {
  assert.deepEqual([...FEATURE_FLAGS], ['duas', 'tasbih', 'mosque-donation', 'qibla-ar', 'prayer-tracker']);
});
