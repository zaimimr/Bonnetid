import { HALAL_RULES } from '../src/lib/halalRules';
import { evaluateIngredients, findRuleMatches, type HalalVerdict } from '../src/lib/halalVerdict';

let failures = 0;

function report(ok: boolean, line: string) {
  if (!ok) failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${line}`);
}

function rule(text: string, ruleId: string, expected: boolean, note = '') {
  const findings = findRuleMatches({ text, language: 'nb', tags: [] }, HALAL_RULES);
  const fired = findings.some((finding) => finding.ruleId === ruleId);
  const suffix = note ? `  (${note})` : '';
  report(fired === expected, `[${ruleId}] ${expected ? 'fires' : 'silent'} on "${text}"${suffix}`);
}

function verdict(
  text: string,
  tags: string[],
  language: string | null,
  expected: HalalVerdict,
  note = '',
) {
  const result = evaluateIngredients({ text, language, tags });
  const suffix = note ? `  (${note})` : '';
  report(
    result.verdict === expected,
    `verdict ${result.verdict}/${result.basis}, expected ${expected}${suffix}`,
  );
}

rule('kokosfett, sukker, salt', 'animal-fat', false, 'plant fat compound');
rule('alkoholfri maltdrikk', 'alcohol-carrier', false, 'alcohol-free claim');
rule('alkoholfri maltdrikk', 'alcohol-drink', false);
rule('pakket i kanister', 'animal-fat', false, 'ister only as a whole word');
rule('fargestoff e1200', 'e120-karmin', false, 'e120 must not match e1200');
rule('gelatinfri godteri', 'gelatin', false, 'negated');
rule('vegansk gele', 'gelatin', false, 'vegan claim negates');
rule('hvitvinseddik, salt', 'alcohol-drink', false, 'vinegar is not wine');
rule('solsikkeolje, rapsolje', 'animal-fat', false);
rule('romtemperatur lagring', 'alcohol-drink', false);
rule('mikrobiell løpe', 'rennet', false, 'negated');

rule('gelatin, sukker', 'gelatin', true);
rule('svinegelatin', 'gelatin', true, 'compound suffix');
rule('gelatinpulver', 'gelatin', true, 'compound prefix');
rule('svinefett', 'pork', true);
rule('svineribbe', 'pork', true);
rule('farge (E 120)', 'e120-karmin', true, 'spaced e-number');
rule('karmin', 'e120-karmin', true);
rule('stabilisator E-441', 'e441', true, 'hyphenated e-number');
rule('emulgator (E471)', 'e471', true);
rule('emulgator (E471)', 'emulgator-ukjent', true);
rule('mono- og diglyserider av fettsyrer', 'mono-diglyserider', true);
rule('mono and diglycerides', 'mono-diglyserider', true);
rule('E542', 'e542', true);
rule('overflatebehandlingsmiddel (shellak)', 'e904-shellac', true);
rule('mel, vann, E920', 'e920-cystein', true);
rule('l-cystein', 'e920-cystein', true);
rule('ost (melk, salt, løpe)', 'rennet', true);
rule('kalveløpe', 'rennet', true, 'compound suffix');
rule('naturlig aroma (alkohol)', 'alcohol-carrier', true);
rule('etanol', 'alcohol-carrier', true);
rule('rødvin', 'alcohol-drink', true);
rule('animalsk fett', 'animal-fat', true);
rule('oksetalg', 'animal-fat', true, 'compound suffix');
rule('myse, melk', 'whey', true);
rule('mysepulver', 'whey', true);
rule('aroma', 'aroma', true);
rule('emulgeringsmiddel', 'emulgator-ukjent', true);

verdict('vann', ['en:water'], 'nb', 'clear');
verdict('vann, sukker, salt', ['en:water', 'en:sugar', 'en:salt'], 'nb', 'clear');
verdict('vann, sukker, gelatin', ['en:water', 'en:sugar'], 'nb', 'uncertain');
verdict('svinefett, salt', ['en:salt'], 'nb', 'avoid');
verdict('svinefett, salt', [], 'fr', 'avoid', 'avoid survives an unreadable language');
verdict('', [], 'nb', 'uncertain', 'no ingredient text');
verdict('eau, sucre, sel', ['en:water', 'en:sugar', 'en:salt'], 'fr', 'uncertain', 'french label');
verdict('vann, sukker', ['en:water', 'en:sugar', 'en:ukjent'], 'nb', 'uncertain', 'unknown tag');
verdict('vann, sukker', [], 'nb', 'uncertain', 'no tags at all');

console.log(failures === 0 ? '\nAll halal engine cases pass.' : `\n${failures} failing cases.`);
process.exit(failures === 0 ? 0 : 1);
