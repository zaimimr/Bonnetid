import { useCallback, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import {
  advance,
  initialTasbih,
  phraseOf,
  targetOf,
  type TasbihGoal,
  type TasbihMode,
  type TasbihTapResult,
} from '@/lib/tasbih';

function feel(result: TasbihTapResult) {
  if (result === 'done' || result === 'step') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  } else if (result === 'lap') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  } else {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }
}

export function useTasbih() {
  useKeepAwake();
  const [state, setState] = useState(() => initialTasbih());

  const tap = useCallback(() => {
    if (state.done) return;
    const { next, result } = advance(state);
    feel(result);
    setState(next);
  }, [state]);

  const reset = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    setState((current) => initialTasbih(current.mode, current.goal));
  }, []);

  const setMode = useCallback((mode: TasbihMode) => {
    setState((current) => initialTasbih(mode, current.goal));
  }, []);

  const setGoal = useCallback((goal: TasbihGoal) => {
    setState(() => initialTasbih('free', goal));
  }, []);

  return {
    state,
    phrase: phraseOf(state),
    target: targetOf(state),
    tap,
    reset,
    setMode,
    setGoal,
  };
}

export type TasbihSession = ReturnType<typeof useTasbih>;
