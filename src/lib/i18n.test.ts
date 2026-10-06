import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isRTL, resolveLanguage, setLanguage, t } from './i18n.ts';

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
  assert.equal(t({ nb: 'Hei', en: 'Hi', ar: 'مرحبا', ur: 'سلام' }), 'مرحبا');
  assert.equal(isRTL(), true);
  setLanguage('nb');
  assert.equal(isRTL(), false);
});
