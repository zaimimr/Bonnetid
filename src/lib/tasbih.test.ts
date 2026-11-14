import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AFTER_PRAYER_STEPS,
  DHIKR,
  advance,
  linkedParts,
  beadsFilled,
  initialTasbih,
  jumpTo,
  stepFractions,
  targetOf,
  totalKey,
  type TasbihState,
  type TasbihStep,
} from './tasbih.ts';

function run(state: TasbihState, steps: TasbihStep[], taps: number) {
  let current = state;
  const results = [];
  for (let i = 0; i < taps; i++) {
    const { next, result } = advance(current, steps);
    current = next;
    results.push(result);
  }
  return { state: current, results };
}

test('after-prayer series runs 33, 33, 33 and one closing tahlil', () => {
  const start = initialTasbih('after-prayer');
  const { state, results } = run(start, AFTER_PRAYER_STEPS, 100);
  assert.equal(state.done, true);
  assert.equal(results.filter((r) => r === 'step').length, 3);
  assert.equal(results.at(-1), 'done');
  assert.equal(results.filter((r) => r === 'done').length, 1);
});

test('step boundaries reset the count and move on', () => {
  const { state } = run(initialTasbih('after-prayer'), AFTER_PRAYER_STEPS, 33);
  assert.equal(state.step, 1);
  assert.equal(state.count, 0);
  assert.equal(totalKey(state, AFTER_PRAYER_STEPS), 'alhamdulillah');
});

test('a 99 step laps every 33 without moving on', () => {
  const steps: TasbihStep[] = [{ dhikr: 'astaghfirullah', target: 99 }];
  const { state, results } = run(initialTasbih('custom'), steps, 66);
  assert.equal(state.count, 66);
  assert.equal(results.filter((r) => r === 'lap').length, 2);
  assert.equal(run(state, steps, 33).state.done, true);
});

test('free count with a goal finishes at the goal, without one it never does', () => {
  assert.equal(run(initialTasbih('free', 99), [], 99).state.done, true);
  const open = run(initialTasbih('free', null), [], 500).state;
  assert.equal(open.done, false);
  assert.equal(open.count, 500);
  assert.equal(totalKey(open, []), 'free');
});

test('beads fill proportionally below 33 and wrap above', () => {
  const state = initialTasbih('free', 11);
  assert.equal(beadsFilled({ ...state, count: 0 }, 1), 0);
  assert.equal(beadsFilled({ ...state, count: 5 }, 11), 15);
  assert.equal(beadsFilled({ ...state, count: 40 }, 99), 7);
  assert.equal(beadsFilled({ ...state, count: 40 }, null), 7);
  assert.equal(beadsFilled({ ...state, done: true }, 99), 33);
});

test('step fractions and jumping', () => {
  const state = { ...initialTasbih('after-prayer'), step: 1, count: 11 };
  assert.deepEqual(stepFractions(state, AFTER_PRAYER_STEPS), [1, 1 / 3, 0, 0]);
  const jumped = jumpTo(state, 3, AFTER_PRAYER_STEPS);
  assert.equal(jumped.step, 3);
  assert.equal(jumped.count, 0);
  assert.equal(targetOf(jumped, AFTER_PRAYER_STEPS), 1);
  assert.equal(jumpTo(state, 9, AFTER_PRAYER_STEPS), state);
});

test('long dhikr splits into matching colour-linked parts, short ones do not', () => {
  const parts = linkedParts(DHIKR.tahlil);
  assert.equal(parts?.arabic.length, 2);
  assert.equal(parts?.transliteration.length, 2);
  assert.equal(linkedParts(DHIKR.subhanallah), null);
});
