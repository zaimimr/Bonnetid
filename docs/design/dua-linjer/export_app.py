import json, os, re

H = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(H, '..', '..', '..', 'src', 'components', 'duas', 'duaArtData.ts')
SCENES = {'after-adhan': 'adhan', 'wudu-mosque': 'wudu', 'after-salah': 'etterBonnen',
          'ramadan': 'ramadan', 'eid': 'eid', 'hajj': 'hajj'}
ROLES = {'#0E5A46': '{ink}', '#0C6B52': '{ink}', '#BF9C55': '{gold}', '#E6D8AC': '{goldSoft}',
         '#E6D9BF': '{goldSoft}', '#D3E4DA': '{greenSoft}'}

src = open(os.path.join(H, 'line3.js')).read()
line = json.loads(src[src.index('=') + 1:].strip().rstrip(';'))


def roles(h):
    for a, b in ROLES.items():
        h = h.replace(a, b)
    left = re.findall(r'#[0-9A-Fa-f]{6}', h)
    if left:
        raise SystemExit(f'unmapped colors: {set(left)}')
    return h


rows = []
for cid, key in SCENES.items():
    s = line[key]
    rows.append(f"  '{cid}': {{\n    d: {json.dumps(s['d'])},\n    under: {json.dumps(roles(s['under']))},\n"
                f"    over: {json.dumps(roles(s['over']))},\n  }},")
open(OUT, 'w').write("import type { DuaCategoryId } from '@/lib/duas';\n\n"
                     "export type DuaArtScene = { d: string; under: string; over: string };\n\n"
                     "export const DUA_ART: Record<DuaCategoryId, DuaArtScene> = {\n" + '\n'.join(rows) + '\n};\n')
