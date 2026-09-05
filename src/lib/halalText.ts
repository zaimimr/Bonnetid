const LETTERS = 'a-z0-9æøåäöüéèêáàâçñ';
const NON_LETTER = new RegExp(`[^${LETTERS}]+`, 'g');
const E_NUMBER = /\be[\s\-.]?(\d{3}[a-z]?)\b/g;

export type TermMatch = 'word' | 'compound';

export type Term = {
  text: string;
  match: TermMatch;
};

export function normalizeIngredientText(input: string): string {
  return input
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(E_NUMBER, 'e$1')
    .replace(NON_LETTER, ' ')
    .trim();
}

export function tokenize(input: string): string[] {
  const normalized = normalizeIngredientText(input);
  return normalized.length === 0 ? [] : normalized.split(' ');
}

function matchesWord(tokens: string[], termTokens: string[]): string | null {
  if (termTokens.length === 0) return null;
  for (let index = 0; index + termTokens.length <= tokens.length; index += 1) {
    let hit = true;
    for (let offset = 0; offset < termTokens.length; offset += 1) {
      if (tokens[index + offset] !== termTokens[offset]) {
        hit = false;
        break;
      }
    }
    if (hit) return tokens.slice(index, index + termTokens.length).join(' ');
  }
  return null;
}

function matchesCompound(tokens: string[], term: string): string | null {
  if (term.length === 0) return null;
  for (const token of tokens) {
    if (token === term || token.startsWith(term) || token.endsWith(term)) return token;
  }
  return null;
}

export function matchTerm(tokens: string[], term: Term): string | null {
  const termTokens = tokenize(term.text);
  if (term.match === 'compound') {
    return termTokens.length === 1 ? matchesCompound(tokens, termTokens[0]) : null;
  }
  return matchesWord(tokens, termTokens);
}

export function matchAnyTerm(tokens: string[], terms: Term[]): string[] {
  const hits: string[] = [];
  for (const term of terms) {
    const hit = matchTerm(tokens, term);
    if (hit && !hits.includes(hit)) hits.push(hit);
  }
  return hits;
}
