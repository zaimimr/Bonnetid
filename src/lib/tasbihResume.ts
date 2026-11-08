import type { TasbihState } from './tasbih.ts';

export type SavedTasbih = {
  state: TasbihState;
  expiresAt: number | null;
};

const FALLBACK_SEQUENCE_MS = 3 * 60 * 60 * 1000;

export function isUntouched(state: TasbihState): boolean {
  return state.count === 0 && state.step === 0;
}

export function shouldSave(state: TasbihState): boolean {
  return !state.done && !isUntouched(state);
}

export function savedTasbih(state: TasbihState, now: number, nextAdhan: number | null): SavedTasbih {
  if (state.mode === 'free') return { state, expiresAt: null };
  return { state, expiresAt: nextAdhan ?? now + FALLBACK_SEQUENCE_MS };
}

export function resumable(saved: SavedTasbih | null, now: number): TasbihState | null {
  if (!saved || !shouldSave(saved.state)) return null;
  if (saved.expiresAt !== null && now >= saved.expiresAt) return null;
  return saved.state;
}

export function parseSavedTasbih(raw: string | null): SavedTasbih | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as SavedTasbih;
    const { state } = value;
    if (state?.mode !== 'sequence' && state?.mode !== 'free') return null;
    if (typeof state.count !== 'number' || typeof state.step !== 'number') return null;
    return value;
  } catch {
    return null;
  }
}
