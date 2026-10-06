import fs from 'node:fs';

const IOS_ID = 6792056685;
const ANDROID_ID = 'no.irn.bonnetid';
const COUNTRY = 'no';
const TERMS = [
  'bønnetid',
  'bønnetider',
  'bønn',
  'bønnetider norge',
  'prayer times',
  'prayer times norway',
  'salah',
  'salat',
  'namaz',
  'qibla',
  'adhan',
  'azan',
  'moské',
  'mosque',
  'ramadan',
  'iftar',
  'hijri kalender',
  'islam',
  'muslim',
  'jumuah',
  'irn',
  'islamsk råd',
  'ibønn',
];

async function iosRank(term) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&country=${COUNTRY}&entity=software&limit=200`;
  const { results } = await (await fetch(url)).json();
  const index = results.findIndex((app) => app.trackId === IOS_ID);
  return index === -1 ? '' : index + 1;
}

async function androidRank(term) {
  const url = `https://play.google.com/store/search?q=${encodeURIComponent(term)}&c=apps&gl=${COUNTRY.toUpperCase()}&hl=${COUNTRY}`;
  const html = await (await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'nb-NO' } })).text();
  const ids = [...new Set([...html.matchAll(/details\?id=([\w.]+)/g)].map((match) => match[1]))];
  const index = ids.indexOf(ANDROID_ID);
  return index === -1 ? '' : index + 1;
}

const date = new Date().toISOString().slice(0, 10);
const rows = [];
for (const term of TERMS) {
  const [ios, android] = await Promise.all([iosRank(term), androidRank(term)]);
  rows.push([date, term, ios, android]);
}

console.table(rows.map(([, term, ios, android]) => ({ term, ios: ios || '-', android: android || '-' })));

const out = process.argv[2];
if (out) {
  if (!fs.existsSync(out)) fs.writeFileSync(out, 'date,term,ios,android\n');
  fs.appendFileSync(out, rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n') + '\n');
}
