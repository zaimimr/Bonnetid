import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cityName, mosqueAddressLine, mosqueCardSubtitle } from './mosqueAddress.ts';

test('city names lose the register all-caps', () => {
  assert.equal(cityName('OSLO'), 'Oslo');
  assert.equal(cityName('MO I RANA'), 'Mo I Rana');
  assert.equal(cityName('LILLESTRØM'), 'Lillestrøm');
  assert.equal(cityName('ÅLESUND'), 'Ålesund');
});

test('detail address skips the post line when the address already has a postcode', () => {
  assert.equal(
    mosqueAddressLine('Sørligata 8A, 0577 Oslo', { code: '0183', city: 'OSLO' }),
    'Sørligata 8A, 0577 Oslo',
  );
  assert.equal(
    mosqueAddressLine('Nygårdsgaten 29', { code: '5811', city: 'BERGEN' }),
    'Nygårdsgaten 29, 5811 Bergen',
  );
  assert.equal(mosqueAddressLine('Grønland 6-8', null), 'Grønland 6-8');
});

test('card subtitle drops a city the address already names', () => {
  assert.equal(mosqueCardSubtitle('Sørligata 8A, 0577 Oslo', 'OSLO'), 'Sørligata 8A, 0577 Oslo');
  assert.equal(mosqueCardSubtitle('Grønland 6-8', 'OSLO'), 'Grønland 6-8 · Oslo');
  assert.equal(mosqueCardSubtitle(null, 'OSLO'), 'Oslo');
  assert.equal(mosqueCardSubtitle('Grønland 6-8', undefined), 'Grønland 6-8');
  assert.equal(mosqueCardSubtitle('Osloveien 5', 'OSLO'), 'Osloveien 5 · Oslo');
});
