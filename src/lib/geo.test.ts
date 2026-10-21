import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isQiblaAligned } from './geo.ts';

test('qibla turns green within 8 degrees', () => {
  assert.equal(isQiblaAligned(140, 148), true);
  assert.equal(isQiblaAligned(139, 148), false);
});

test('qibla stays green until 12 degrees off', () => {
  assert.equal(isQiblaAligned(137, 148, 0, true), true);
  assert.equal(isQiblaAligned(135, 148, 0, true), false);
});

test('qibla tolerance widens with location uncertainty', () => {
  assert.equal(isQiblaAligned(128, 148, 20), true);
});

test('qibla alignment wraps around north', () => {
  assert.equal(isQiblaAligned(355, 2), true);
});
