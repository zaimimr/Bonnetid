import assert from 'node:assert/strict';
import test from 'node:test';
import type { TasbihState } from './tasbih.ts';
import { parseSavedTasbih, resumable, savedTasbih, shouldSave } from './tasbihResume.ts';

const HOUR = 60 * 60 * 1000;
const now = Date.UTC(2026, 10, 8, 12);

function state(partial: Partial<TasbihState>): TasbihState {
  return { mode: 'sequence', step: 0, count: 0, goal: 33, done: false, ...partial };
}

test('only unfinished, started counts are saved', () => {
  assert.equal(shouldSave(state({})), false);
  assert.equal(shouldSave(state({ count: 5 })), true);
  assert.equal(shouldSave(state({ step: 1 })), true);
  assert.equal(shouldSave(state({ count: 100, step: 3, done: true })), false);
});

test('after-prayer count expires at the next adhan', () => {
  const saved = savedTasbih(state({ step: 1, count: 4 }), now, now + HOUR);
  assert.deepEqual(resumable(saved, now + HOUR - 1), saved.state);
  assert.equal(resumable(saved, now + HOUR), null);
});

test('after-prayer count without prayer times expires after three hours', () => {
  const saved = savedTasbih(state({ count: 4 }), now, null);
  assert.notEqual(resumable(saved, now + 3 * HOUR - 1), null);
  assert.equal(resumable(saved, now + 3 * HOUR), null);
});

test('free count lasts until reset', () => {
  const saved = savedTasbih(state({ mode: 'free', goal: null, count: 412 }), now, now + HOUR);
  assert.equal(saved.expiresAt, null);
  assert.deepEqual(resumable(saved, now + 400 * 24 * HOUR), saved.state);
});

test('finished or empty saves are not offered', () => {
  assert.equal(resumable(null, now), null);
  assert.equal(resumable({ state: state({ done: true, count: 100 }), expiresAt: null }, now), null);
  assert.equal(resumable({ state: state({}), expiresAt: null }, now), null);
});

test('parse rejects junk', () => {
  assert.equal(parseSavedTasbih(null), null);
  assert.equal(parseSavedTasbih('not json'), null);
  assert.equal(parseSavedTasbih('{"state":{"mode":"x"}}'), null);
  const saved = savedTasbih(state({ count: 7 }), now, null);
  assert.deepEqual(parseSavedTasbih(JSON.stringify(saved)), saved);
});
