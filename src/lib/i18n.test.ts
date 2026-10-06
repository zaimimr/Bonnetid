import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isRTL, resolveLanguage, setLanguage, t, tCount } from './i18n.ts';

test('first supported phone language wins', () => {
  assert.equal(resolveLanguage(['sv', 'ur-PK', 'en']), 'ur');
  assert.equal(resolveLanguage(['no']), 'nb');
  assert.equal(resolveLanguage(['nn-NO']), 'nb');
});

test('unsupported phone languages fall back to English', () => {
  assert.equal(resolveLanguage(['tr', null]), 'en');
});

test('t picks the active language and RTL follows it', () => {
  setLanguage('ar');
  assert.equal(t('common.duration.joiner'), ' و');
  assert.equal(tCount('common.duration.hours', 2), 'ساعتان');
  assert.equal(tCount('common.duration.hours', 5), '5 ساعات');
  assert.equal(tCount('common.duration.hours', 12), '12 ساعة');
  assert.equal(isRTL(), true);
  setLanguage('nb');
  assert.equal(isRTL(), false);
});
