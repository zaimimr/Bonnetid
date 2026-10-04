import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareVersions, pendingWhatsNew, visibleItems, WHATS_NEW, type WhatsNewEntry } from './whatsNew.ts';

const entries: WhatsNewEntry[] = [
  { version: '1.10.0', items: [{ title: 'C', body: 'c', icon: 'star-outline' }] },
  { version: '1.9.0', items: [{ title: 'B', body: 'b', icon: 'star-outline' }] },
  { version: '1.8.0', items: [{ title: 'A', body: 'a', icon: 'star-outline' }] },
];

test('compareVersions is numeric per segment', () => {
  assert.ok(compareVersions('1.10.0', '1.9.0') > 0);
  assert.equal(compareVersions('1.9.0', '1.9.0'), 0);
  assert.ok(compareVersions('1.8.1', '1.9') < 0);
});

test('pending shows entries after lastSeen up to current', () => {
  assert.deepEqual(pendingWhatsNew(entries, '1.8.0', '1.9.0').map((e) => e.version), ['1.9.0']);
  assert.deepEqual(pendingWhatsNew(entries, '1.8.0', '1.10.0').map((e) => e.version), ['1.10.0', '1.9.0']);
});

test('nothing pending when lastSeen is null or current', () => {
  assert.deepEqual(pendingWhatsNew(entries, null, '1.10.0'), []);
  assert.deepEqual(pendingWhatsNew(entries, '1.10.0', '1.10.0'), []);
});

test('items behind a disabled flag are hidden', () => {
  const items = [
    { title: 'x', body: 'x', icon: 'a', flag: 'duas' as const },
    { title: 'y', body: 'y', icon: 'b' },
  ];
  assert.deepEqual(visibleItems(items, (flag) => flag !== 'duas', 'ios').map((i) => i.title), ['y']);
});

test('items for another platform are hidden', () => {
  const items = [
    { title: 'x', body: 'x', icon: 'a', platform: 'ios' as const },
    { title: 'y', body: 'y', icon: 'b', platform: 'android' as const },
    { title: 'z', body: 'z', icon: 'c' },
  ];
  assert.deepEqual(visibleItems(items, () => true, 'android').map((i) => i.title), ['y', 'z']);
});

test('shipped content is sorted newest first', () => {
  const versions = WHATS_NEW.map((e) => e.version);
  assert.deepEqual([...versions].sort((a, b) => compareVersions(b, a)), versions);
});
