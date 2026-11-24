import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lowSunPrayers, nightKind } from './lowSun.ts';

const OSLO = 59.91;
const TROMSO = 69.65;
const KRISTIANSAND = 58.15;

function countDays(lat: number, kind: string) {
  let count = 0;
  for (let time = Date.UTC(2026, 0, 1); time < Date.UTC(2027, 0, 1); time += 86_400_000) {
    if (nightKind(lat, new Date(time).toISOString().slice(0, 10)) === kind) count++;
  }
  return count;
}

test('Oslo has light summer nights but no midnight sun', () => {
  assert.equal(nightKind(OSLO, '2026-06-21'), 'twilight');
  assert.equal(nightKind(OSLO, '2026-12-21'), 'normal');
  assert.equal(nightKind(OSLO, '2026-03-20'), 'normal');
  assert.equal(countDays(OSLO, 'midnightSun'), 0);
  const twilight = countDays(OSLO, 'twilight');
  assert.ok(twilight > 100 && twilight < 130, `Oslo twilight days ${twilight}`);
});

test('Tromsø has midnight sun around the solstice', () => {
  assert.equal(nightKind(TROMSO, '2026-06-21'), 'midnightSun');
  assert.equal(nightKind(TROMSO, '2026-12-21'), 'normal');
  const midnightSun = countDays(TROMSO, 'midnightSun');
  assert.ok(midnightSun > 55 && midnightSun < 70, `Tromsø midnight sun days ${midnightSun}`);
});

test('the south still has light nights in midsummer', () => {
  assert.equal(nightKind(KRISTIANSAND, '2026-06-21'), 'twilight');
  assert.equal(nightKind(KRISTIANSAND, '2026-09-01'), 'normal');
});

test('which prayers are explained', () => {
  assert.deepEqual(lowSunPrayers('normal'), []);
  assert.deepEqual(lowSunPrayers('twilight'), ['fajr', 'isha']);
  assert.deepEqual(lowSunPrayers('midnightSun'), ['fajr', 'maghrib', 'isha']);
});
