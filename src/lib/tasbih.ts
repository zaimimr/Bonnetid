import { duaById } from './duas.ts';

export type TasbihPhrase = {
  arabic: string;
  transliteration: string;
  meaning: string;
};

export const DHIKR_IDS = ['subhanallah', 'alhamdulillah', 'allahu-akbar', 'astaghfirullah', 'tahlil'] as const;
export type DhikrId = (typeof DHIKR_IDS)[number];

export type TasbihStep = { dhikr: DhikrId; target: number };
export type TasbihSeries = { id: string; name: string; steps: TasbihStep[] };

export type TasbihGoal = number | null;

export type TasbihState = {
  series: string;
  step: number;
  count: number;
  goal: TasbihGoal;
  done: boolean;
};

export type TasbihTapResult = 'count' | 'lap' | 'step' | 'done';

export const BEADS_PER_ROUND = 33;
export const FREE_ID = 'free';
export const AFTER_PRAYER_ID = 'after-prayer';
export const GOAL_PRESETS = [33, 99, 100] as const;
export const MAX_TARGET = 9999;

function lines(text: string | undefined): string[] {
  return (text ?? '').split('\n');
}

function phrase(arabic = '', transliteration = '', meaning = ''): TasbihPhrase {
  return { arabic, transliteration, meaning };
}

const tasbih = duaById('tasbih');
const arabic = lines(tasbih?.arabic);
const transliteration = lines(tasbih?.transliteration);
const meaning = lines(tasbih?.meaning);
const istighfar = duaById('istighfar');
const completion = duaById('tasbih-completion');

export const COMPLETION_DUA_ID = completion?.id ?? null;

export const DHIKR: Record<DhikrId, TasbihPhrase> = {
  subhanallah: phrase(arabic[0], transliteration[0], meaning[0]),
  alhamdulillah: phrase(arabic[1], transliteration[1], meaning[1]),
  'allahu-akbar': phrase(arabic[2], transliteration[2], meaning[2]),
  astaghfirullah: phrase(istighfar?.arabic, istighfar?.transliteration, istighfar?.meaning),
  tahlil: phrase(completion?.arabic, completion?.transliteration, completion?.meaning),
};

export const AFTER_PRAYER_STEPS: TasbihStep[] = [
  { dhikr: 'subhanallah', target: 33 },
  { dhikr: 'alhamdulillah', target: 33 },
  { dhikr: 'allahu-akbar', target: 33 },
  { dhikr: 'tahlil', target: 1 },
];

export function isDhikrId(value: unknown): value is DhikrId {
  return typeof value === 'string' && (DHIKR_IDS as readonly string[]).includes(value);
}

export function clampTarget(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(Math.max(Math.round(value), 1), MAX_TARGET);
}

export function initialTasbih(series: string = FREE_ID, goal: TasbihGoal = 33): TasbihState {
  return { series, step: 0, count: 0, goal, done: false };
}

export function isFree(state: TasbihState): boolean {
  return state.series === FREE_ID;
}

export function currentStep(state: TasbihState, steps: TasbihStep[]): TasbihStep | null {
  if (isFree(state)) return null;
  return steps[Math.min(state.step, steps.length - 1)] ?? null;
}

export function targetOf(state: TasbihState, steps: TasbihStep[]): number | null {
  if (isFree(state)) return state.goal;
  return currentStep(state, steps)?.target ?? null;
}

export function phraseOf(state: TasbihState, steps: TasbihStep[]): TasbihPhrase | null {
  const step = currentStep(state, steps);
  return step ? DHIKR[step.dhikr] : null;
}

export function totalKey(state: TasbihState, steps: TasbihStep[]): string {
  return currentStep(state, steps)?.dhikr ?? FREE_ID;
}

export function beadsFilled(state: TasbihState, target: number | null): number {
  if (state.done) return BEADS_PER_ROUND;
  if (target !== null && target < BEADS_PER_ROUND) {
    return Math.floor((state.count * BEADS_PER_ROUND) / target);
  }
  return state.count % BEADS_PER_ROUND;
}

export function stepFractions(state: TasbihState, steps: TasbihStep[]): number[] {
  return steps.map((step, index) => {
    if (state.done || index < state.step) return 1;
    if (index > state.step) return 0;
    return Math.min(state.count / step.target, 1);
  });
}

export function jumpTo(state: TasbihState, step: number, steps: TasbihStep[]): TasbihState {
  if (isFree(state) || step < 0 || step >= steps.length) return state;
  return { ...state, step, count: 0, done: false };
}

export function advance(state: TasbihState, steps: TasbihStep[]): { next: TasbihState; result: TasbihTapResult } {
  if (state.done) return { next: state, result: 'count' };
  const count = state.count + 1;
  const lap = count % BEADS_PER_ROUND === 0;

  if (isFree(state)) {
    const reachedGoal = state.goal !== null && count === state.goal;
    return {
      next: { ...state, count, done: reachedGoal },
      result: reachedGoal ? 'done' : lap ? 'lap' : 'count',
    };
  }

  const target = targetOf(state, steps);
  if (target === null) return { next: { ...state, done: true }, result: 'done' };
  if (count < target) return { next: { ...state, count }, result: lap ? 'lap' : 'count' };
  if (state.step < steps.length - 1) {
    return { next: { ...state, step: state.step + 1, count: 0 }, result: 'step' };
  }
  return { next: { ...state, count, done: true }, result: 'done' };
}

export function linkedParts(value: TasbihPhrase): { arabic: string[]; transliteration: string[] } | null {
  const arabicParts = value.arabic.split('،').map((part) => part.trim()).filter(Boolean);
  const latinParts = value.transliteration.split(',').map((part) => part.trim()).filter(Boolean);
  if (arabicParts.length < 2 || arabicParts.length !== latinParts.length) return null;
  return { arabic: arabicParts, transliteration: latinParts };
}
