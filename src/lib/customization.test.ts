import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_TAB_SLOTS,
  HOME_BLOCK_IDS,
  moveHomeBlock,
  moveSlot,
  normalizeHomeLayout,
  normalizeSlots,
  setHomeBlockVisible,
  toggleSlot,
} from './customization.ts';

test('normalizeSlots drops unknown and duplicate ids and caps length', () => {
  assert.deepEqual(normalizeSlots(['qibla', 'nope', 'qibla', 'duas', 'tasbih', 'tracker'], 3, []), [
    'qibla',
    'duas',
    'tasbih',
  ]);
  assert.deepEqual(normalizeSlots(undefined, 3, DEFAULT_TAB_SLOTS), DEFAULT_TAB_SLOTS);
  assert.deepEqual(normalizeSlots([], 3, DEFAULT_TAB_SLOTS), []);
});

test('toggleSlot adds until max and removes', () => {
  assert.deepEqual(toggleSlot(['calendar'], 'qibla', 3), ['calendar', 'qibla']);
  assert.deepEqual(toggleSlot(['calendar', 'qibla'], 'calendar', 3), ['qibla']);
  assert.deepEqual(toggleSlot(['calendar', 'qibla', 'duas'], 'tasbih', 3), ['calendar', 'qibla', 'duas']);
});

test('moveSlot reorders within bounds', () => {
  assert.deepEqual(moveSlot(['calendar', 'qibla', 'duas'], 'duas', -1), ['calendar', 'duas', 'qibla']);
  assert.deepEqual(moveSlot(['calendar', 'qibla'], 'calendar', -1), ['calendar', 'qibla']);
  assert.deepEqual(moveSlot(['calendar', 'qibla'], 'qibla', 1), ['calendar', 'qibla']);
});

test('normalizeHomeLayout keeps order, appends missing blocks, forces locked visible', () => {
  const layout = normalizeHomeLayout([
    { id: 'prayer-times', visible: false },
    { id: 'night', visible: false },
    { id: 'bogus', visible: true },
    { id: 'night', visible: true },
  ]);
  assert.deepEqual(layout.slice(0, 2), [
    { id: 'prayer-times', visible: true },
    { id: 'night', visible: false },
  ]);
  assert.equal(layout.length, HOME_BLOCK_IDS.length);
  assert.deepEqual(normalizeHomeLayout(null).map((block) => block.id), [...HOME_BLOCK_IDS]);
});

test('moveHomeBlock and setHomeBlockVisible', () => {
  const layout = normalizeHomeLayout([]);
  const moved = moveHomeBlock(layout, 'shortcuts', -1);
  assert.deepEqual(moved.slice(0, 2).map((block) => block.id), ['shortcuts', 'next-prayer']);
  assert.equal(moveHomeBlock(layout, 'next-prayer', -1), layout);
  const hidden = setHomeBlockVisible(layout, 'season', false);
  assert.equal(hidden.find((block) => block.id === 'season')?.visible, false);
  assert.equal(setHomeBlockVisible(layout, 'next-prayer', false), layout);
});
