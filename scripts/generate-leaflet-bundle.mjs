import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const leafletRoot = dirname(require.resolve('leaflet/package.json'));
const { version } = require('leaflet/package.json');

const readDist = (file) => {
  const source = readFileSync(join(leafletRoot, 'dist', file), 'utf8');
  if (source.includes('</script')) {
    throw new Error(`${file} contains a closing script tag and cannot be inlined verbatim`);
  }
  return source;
};

const js = readDist('leaflet.js');
const css = readDist('leaflet.css');

const output = `export const LEAFLET_VERSION = ${JSON.stringify(version)};

export const LEAFLET_JS = ${JSON.stringify(js)};

export const LEAFLET_CSS = ${JSON.stringify(css)};
`;

const target = join(root, 'src/lib/leaflet.generated.ts');
writeFileSync(target, output, 'utf8');

console.log(`Wrote ${target} from leaflet ${version} (${js.length} B js, ${css.length} B css)`);
