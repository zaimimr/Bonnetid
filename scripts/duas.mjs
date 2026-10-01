import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = mkdtempSync(join(tmpdir(), 'duas-'));

execFileSync(
  join(root, 'node_modules/.bin/tsc'),
  [
    join(root, 'src/lib/duas.ts'),
    '--outDir',
    outDir,
    '--module',
    'commonjs',
    '--target',
    'es2020',
    '--strict',
    '--skipLibCheck',
    '--ignoreConfig',
  ],
  { stdio: 'inherit' },
);

const { DUAS, DUA_CATEGORIES, DUA_LINKS } = createRequire(import.meta.url)(join(outDir, 'duas.js'));

function check() {
  const failures = [];
  const ids = new Set();
  for (const dua of DUAS) {
    if (ids.has(dua.id)) failures.push(`duplicate id ${dua.id}`);
    ids.add(dua.id);
    for (const field of ['title', 'arabic', 'transliteration', 'meaning', 'source']) {
      if (typeof dua[field] !== 'string' || dua[field].trim() === '') {
        failures.push(`${dua.id}: empty ${field}`);
      }
    }
    if (!DUA_CATEGORIES.some((category) => category.id === dua.category)) {
      failures.push(`${dua.id}: unknown category ${dua.category}`);
    }
    if (dua.repeat !== undefined && !(Number.isInteger(dua.repeat) && dua.repeat > 0)) {
      failures.push(`${dua.id}: repeat must be a positive integer`);
    }
    if (/—/.test(JSON.stringify(dua))) failures.push(`${dua.id}: contains an em dash`);
  }
  for (const category of DUA_CATEGORIES) {
    if (!DUAS.some((dua) => dua.category === category.id)) {
      failures.push(`category ${category.id} has no duas`);
    }
  }
  const categoryIds = new Set(DUA_CATEGORIES.map((category) => category.id));
  for (const [name, target] of Object.entries(DUA_LINKS)) {
    if (!ids.has(target) && !categoryIds.has(target)) failures.push(`link ${name} -> ${target} missing`);
  }

  if (failures.length > 0) {
    console.error(failures.join('\n'));
    process.exit(1);
  }
  console.log(`OK ${DUAS.length} duas in ${DUA_CATEGORIES.length} categories`);
}

function review() {
  const lines = [
    '# Duaer i Bønnetid - til gjennomgang',
    '',
    'Alle duaer appen viser, med arabisk tekst, translitterasjon, norsk betydning og kilde.',
    'Merk rettelser direkte i teksten eller som kommentar ved hver dua.',
    '',
  ];
  for (const category of DUA_CATEGORIES) {
    lines.push(`## ${category.title}`, '');
    for (const dua of DUAS.filter((entry) => entry.category === category.id)) {
      lines.push(`### ${dua.title}`, '');
      lines.push(`<div dir="rtl" lang="ar">${dua.arabic}</div>`, '');
      lines.push(`*${dua.transliteration}*`, '');
      lines.push(dua.meaning, '');
      if (dua.note) lines.push(`Merknad: ${dua.note}`, '');
      if (dua.repeat) lines.push(`Gjentas ${dua.repeat} ganger.`, '');
      lines.push(`Kilde: ${dua.source}`, '');
    }
  }
  console.log(lines.join('\n'));
}

const mode = process.argv[2] ?? 'check';
if (mode === 'check') check();
else if (mode === 'review') review();
else {
  console.error(`unknown mode ${mode}, use check or review`);
  process.exit(1);
}
