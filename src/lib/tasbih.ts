import { duaById } from './duas';

export type TasbihMode = 'sequence' | 'free';
export type TasbihGoal = 33 | 100 | null;

export type TasbihPhrase = {
  arabic: string;
  transliteration: string;
  meaning: string;
};

export type TasbihState = {
  mode: TasbihMode;
  step: number;
  count: number;
  goal: TasbihGoal;
  done: boolean;
};

export type TasbihTapResult = 'count' | 'lap' | 'step' | 'done';

export const BEADS_PER_ROUND = 33;
export const SEQUENCE_TARGET = 33;

function lines(text: string | undefined): string[] {
  return (text ?? '').split('\n');
}

const tasbih = duaById('tasbih');
const arabic = lines(tasbih?.arabic);
const transliteration = lines(tasbih?.transliteration);
const meaning = lines(tasbih?.meaning);

export const SEQUENCE: TasbihPhrase[] = arabic.map((line, index) => ({
  arabic: line,
  transliteration: transliteration[index] ?? '',
  meaning: meaning[index] ?? '',
}));

export const COMPLETION = duaById('tasbih-completion');

export function initialTasbih(mode: TasbihMode = 'sequence', goal: TasbihGoal = 33): TasbihState {
  return { mode, step: 0, count: 0, goal, done: false };
}

export function targetOf(state: TasbihState): number | null {
  return state.mode === 'sequence' ? SEQUENCE_TARGET : state.goal;
}

export function phraseOf(state: TasbihState): TasbihPhrase | null {
  return state.mode === 'sequence' ? (SEQUENCE[state.step] ?? null) : null;
}

export function advance(state: TasbihState): { next: TasbihState; result: TasbihTapResult } {
  if (state.done) return { next: state, result: 'count' };
  const count = state.count + 1;

  if (state.mode === 'free') {
    const reachedGoal = state.goal !== null && count === state.goal;
    const lap = count % BEADS_PER_ROUND === 0;
    return {
      next: { ...state, count, done: reachedGoal },
      result: reachedGoal ? 'done' : lap ? 'lap' : 'count',
    };
  }

  if (count < SEQUENCE_TARGET) return { next: { ...state, count }, result: 'count' };
  if (state.step < SEQUENCE.length - 1) {
    return { next: { ...state, step: state.step + 1, count: 0 }, result: 'step' };
  }
  return { next: { ...state, count, done: true }, result: 'done' };
}
