import { HALAL_ALLOWED_TAGS } from './halalAllowlist';
import { HALAL_RULES, type HalalRule, type RuleSeverity } from './halalRules';
import { matchAnyTerm, matchTerm, tokenize } from './halalText';

export type HalalVerdict = 'clear' | 'uncertain' | 'avoid';

export type VerdictBasis =
  | 'rules'
  | 'no-ingredients'
  | 'unreadable-language'
  | 'incomplete-data'
  | 'allowlisted';

export type IngredientSource = {
  text: string;
  language: string | null;
  tags: string[];
};

export type VerdictFinding = {
  ruleId: string;
  severity: RuleSeverity;
  label: string;
  reason: string;
  matched: string[];
};

export type HalalVerdictResult = {
  verdict: HalalVerdict;
  basis: VerdictBasis;
  findings: VerdictFinding[];
  unrecognised: string[];
};

export const READABLE_LANGUAGES = ['nb', 'nn', 'no', 'da', 'sv', 'en'];

const MAX_UNRECOGNISED = 12;

export function isReadableLanguage(language: string | null): boolean {
  if (!language) return false;
  return READABLE_LANGUAGES.includes(language.toLowerCase());
}

export function findRuleMatches(source: IngredientSource, rules: HalalRule[]): VerdictFinding[] {
  const tokens = tokenize(source.text);
  if (tokens.length === 0) return [];

  const findings: VerdictFinding[] = [];
  for (const rule of rules) {
    const negated = rule.negatedBy?.some((term) => matchTerm(tokens, term) !== null) ?? false;
    if (negated) continue;
    const matched = matchAnyTerm(tokens, rule.terms);
    if (matched.length === 0) continue;
    findings.push({
      ruleId: rule.id,
      severity: rule.severity,
      label: rule.label,
      reason: rule.reason,
      matched,
    });
  }
  return findings;
}

export function unrecognisedTags(tags: string[], allowlist: ReadonlySet<string>): string[] {
  const unknown: string[] = [];
  for (const tag of tags) {
    if (allowlist.has(tag) || unknown.includes(tag)) continue;
    unknown.push(tag);
  }
  return unknown;
}

export function evaluateIngredients(
  source: IngredientSource,
  rules: HalalRule[] = HALAL_RULES,
  allowlist: ReadonlySet<string> = HALAL_ALLOWED_TAGS,
): HalalVerdictResult {
  const tokens = tokenize(source.text);

  if (tokens.length === 0) {
    return { verdict: 'uncertain', basis: 'no-ingredients', findings: [], unrecognised: [] };
  }

  const findings = findRuleMatches(source, rules);

  if (findings.some((finding) => finding.severity === 'avoid')) {
    return { verdict: 'avoid', basis: 'rules', findings, unrecognised: [] };
  }

  if (findings.length > 0) {
    return { verdict: 'uncertain', basis: 'rules', findings, unrecognised: [] };
  }

  if (!isReadableLanguage(source.language)) {
    return { verdict: 'uncertain', basis: 'unreadable-language', findings, unrecognised: [] };
  }

  const unknown = unrecognisedTags(source.tags, allowlist);
  if (source.tags.length === 0 || unknown.length > 0) {
    return {
      verdict: 'uncertain',
      basis: 'incomplete-data',
      findings,
      unrecognised: unknown.slice(0, MAX_UNRECOGNISED),
    };
  }

  return { verdict: 'clear', basis: 'allowlisted', findings, unrecognised: [] };
}

export function verdictRank(verdict: HalalVerdict): number {
  if (verdict === 'avoid') return 2;
  if (verdict === 'uncertain') return 1;
  return 0;
}
