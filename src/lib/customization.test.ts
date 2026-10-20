import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  addHomeBlock,
  DEFAULT_TAB_SLOTS,
  HOME_BLOCK_IDS,
  normalizeHomeLayout,
  normalizeSlots,
  orderHomeBlocks,
  setHomeBlockVisible,
  toggleSlot,
  upgradeDefault,
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

test('orderHomeBlocks applies the dragged order and keeps hidden blocks last', () => {
  const layout = setHomeBlockVisible(normalizeHomeLayout([]), 'night', false);
  const visible = layout.filter((block) => block.visible).map((block) => block.id);
  const ordered = orderHomeBlocks(layout, [...visible].reverse());
  assert.deepEqual(ordered.map((block) => block.id), [...[...visible].reverse(), 'night']);
  assert.equal(ordered.at(-1)?.visible, false);
});

test('addHomeBlock shows a hidden block after the visible ones', () => {
  const layout = setHomeBlockVisible(setHomeBlockVisible(normalizeHomeLayout([]), 'night', false), 'season', false);
  const added = addHomeBlock(layout, 'night');
  const index = added.findIndex((block) => block.id === 'night');
  assert.deepEqual(added[index], { id: 'night', visible: true });
  assert.equal(added[index - 1].visible, true);
  assert.deepEqual(added[index + 1], { id: 'season', visible: false });
});

test('setHomeBlockVisible keeps locked blocks visible', () => {
  const layout = normalizeHomeLayout([]);
  const hidden = setHomeBlockVisible(layout, 'season', false);
  assert.equal(hidden.find((block) => block.id === 'season')?.visible, false);
  assert.equal(setHomeBlockVisible(layout, 'next-prayer', false), layout);
});

test('upgradeDefault replaces only an untouched previous default', () => {
  assert.deepEqual(upgradeDefault(['calendar', 'qibla'], ['calendar', 'qibla'], ['calendar', 'qibla', 'mosques']), [
    'calendar',
    'qibla',
    'mosques',
  ]);
  assert.deepEqual(upgradeDefault(['qibla', 'calendar'], ['calendar', 'qibla'], ['calendar', 'qibla', 'mosques']), [
    'qibla',
    'calendar',
  ]);
  assert.deepEqual(upgradeDefault(['calendar'], ['calendar', 'qibla'], ['calendar', 'qibla', 'mosques']), ['calendar']);
});
