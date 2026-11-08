import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { useNow } from '@/hooks/useNow';
import { usePrayerDay } from '@/hooks/usePrayerDay';
import {
  advance,
  initialTasbih,
  phraseOf,
  progressOf,
  targetOf,
  totalOf,
  type TasbihGoal,
  type TasbihMode,
  type TasbihState,
  type TasbihTapResult,
} from '@/lib/tasbih';
import { isUntouched, parseSavedTasbih, resumable, savedTasbih, shouldSave } from '@/lib/tasbihResume';

const STORAGE_KEY = 'tasbih_v1';

function feel(result: TasbihTapResult) {
  if (result === 'done' || result === 'step') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  } else if (result === 'lap') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  } else {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }
}

function forget() {
  AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
}

export function useTasbih() {
  useKeepAwake();
  const [state, setState] = useState(() => initialTasbih());
  const [offer, setOffer] = useState<TasbihState | null>(null);
  const now = useNow(60_000);
  const nextAdhan = usePrayerDay(now).nextPrayer?.next.date.getTime() ?? null;

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (active) setOffer(resumable(parseSavedTasbih(raw), Date.now()));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (state.done) {
      forget();
    } else if (shouldSave(state)) {
      const saved = savedTasbih(state, Date.now(), nextAdhan);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(saved)).catch(() => {});
    }
  }, [state, nextAdhan]);

  const tap = useCallback(() => {
    if (state.done) return;
    const { next, result } = advance(state);
    feel(result);
    setOffer(null);
    setState(next);
  }, [state]);

  const reset = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    forget();
    setOffer(null);
    setState((current) => initialTasbih(current.mode, current.goal));
  }, []);

  const resume = useCallback(() => {
    if (!offer) return;
    Haptics.selectionAsync().catch(() => {});
    setState(offer);
    setOffer(null);
  }, [offer]);

  const setMode = useCallback((mode: TasbihMode) => {
    setState((current) => initialTasbih(mode, current.goal));
  }, []);

  const setGoal = useCallback((goal: TasbihGoal) => {
    setState(() => initialTasbih('free', goal));
  }, []);

  const resumeOffer =
    offer && isUntouched(state) ? { count: progressOf(offer), target: totalOf(offer) } : null;

  return {
    state,
    phrase: phraseOf(state),
    target: targetOf(state),
    resumeOffer,
    tap,
    reset,
    resume,
    setMode,
    setGoal,
  };
}

export type TasbihSession = ReturnType<typeof useTasbih>;
