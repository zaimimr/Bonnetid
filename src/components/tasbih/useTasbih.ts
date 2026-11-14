import { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { useFocusEffect } from 'expo-router';
import { useNow } from '@/hooks/useNow';
import { usePrayerDay } from '@/hooks/usePrayerDay';
import { t } from '@/lib/i18n';
import {
  AFTER_PRAYER_ID,
  AFTER_PRAYER_STEPS,
  FREE_ID,
  advance,
  initialTasbih,
  jumpTo,
  dhikrOf,
  phraseOf,
  targetOf,
  totalKey,
  type DhikrId,
  type TasbihGoal,
  type TasbihSeries,
  type TasbihState,
  type TasbihTapResult,
} from '@/lib/tasbih';
import { isUntouched, parseSavedTasbih, resumable, savedTasbih, shouldSave } from '@/lib/tasbihResume';
import { todayCount } from '@/lib/tasbihStats';
import { useTasbihStore } from '@/store/tasbih';

const STORAGE_KEY = 'tasbih_v2';

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

export function useSeries(id: string): TasbihSeries | null {
  const custom = useTasbihStore((store) => store.series.find((item) => item.id === id) ?? null);
  return useMemo(() => {
    if (id === AFTER_PRAYER_ID) return { id, name: t('tasbih.afterPrayer'), steps: AFTER_PRAYER_STEPS };
    return custom;
  }, [id, custom]);
}

export function useSavedTasbih(): TasbihState | null {
  const [saved, setSaved] = useState<TasbihState | null>(null);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      AsyncStorage.getItem(STORAGE_KEY)
        .then((raw) => {
          if (active) setSaved(resumable(parseSavedTasbih(raw), Date.now()));
        })
        .catch(() => {});
      return () => {
        active = false;
      };
    }, []),
  );
  return saved;
}

export function useTasbih(seriesId: string, resumeNow = false) {
  useKeepAwake();
  const series = useSeries(seriesId);
  const steps = useMemo(() => series?.steps ?? [], [series]);
  const freeGoal = useTasbihStore((store) => store.freeGoal);
  const setFreeGoal = useTasbihStore((store) => store.setFreeGoal);
  const addToTotal = useTasbihStore((store) => store.addToTotal);
  const totals = useTasbihStore((store) => store.totals);
  const daily = useTasbihStore((store) => store.daily);
  const freeDhikr = useTasbihStore((store) => store.freeDhikr);
  const setStoredFreeDhikr = useTasbihStore((store) => store.setFreeDhikr);
  const [state, setState] = useState(() => initialTasbih(seriesId, seriesId === FREE_ID ? freeGoal : null));
  const [offer, setOffer] = useState<TasbihState | null>(null);
  const now = useNow(60_000);
  const nextAdhan = usePrayerDay(now).nextPrayer?.next.date.getTime() ?? null;

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        const saved = resumable(parseSavedTasbih(raw), Date.now());
        if (!active || saved?.series !== seriesId) return;
        if (resumeNow) setState(saved);
        else setOffer(saved);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [seriesId, resumeNow]);

  useEffect(() => {
    if (state.done) {
      forget();
    } else if (shouldSave(state)) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(savedTasbih(state, Date.now(), nextAdhan))).catch(() => {});
    }
  }, [state, nextAdhan]);

  const tap = useCallback(() => {
    if (state.done) return;
    const { next, result } = advance(state, steps);
    feel(result);
    addToTotal(totalKey(state, steps, freeDhikr));
    setOffer(null);
    setState(next);
  }, [state, steps, freeDhikr, addToTotal]);

  const reset = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    forget();
    setOffer(null);
    setState((current) => initialTasbih(current.series, current.goal));
  }, []);

  const resume = useCallback(() => {
    if (!offer) return;
    Haptics.selectionAsync().catch(() => {});
    setState(offer);
    setOffer(null);
  }, [offer]);

  const setGoal = useCallback(
    (goal: TasbihGoal) => {
      setFreeGoal(goal);
      setState((current) =>
        current.done || (goal !== null && current.count >= goal) ? initialTasbih(FREE_ID, goal) : { ...current, goal },
      );
    },
    [setFreeGoal],
  );

  const setFreeDhikr = useCallback(
    (dhikr: DhikrId) => {
      setStoredFreeDhikr(dhikr);
      setOffer(null);
      setState((current) => initialTasbih(FREE_ID, current.goal));
    },
    [setStoredFreeDhikr],
  );

  const jump = useCallback(
    (step: number) => {
      Haptics.selectionAsync().catch(() => {});
      setOffer(null);
      setState((current) => jumpTo(current, step, steps));
    },
    [steps],
  );

  const resumeOffer =
    offer && isUntouched(state)
      ? { count: offer.count, target: targetOf(offer, steps), dhikr: dhikrOf(offer, steps, freeDhikr) }
      : null;

  return {
    series,
    steps,
    state,
    dhikr: dhikrOf(state, steps, freeDhikr),
    phrase: phraseOf(state, steps, freeDhikr),
    target: targetOf(state, steps),
    total: totals[totalKey(state, steps, freeDhikr)] ?? 0,
    today: todayCount(daily, now, totalKey(state, steps, freeDhikr)),
    totals,
    resumeOffer,
    tap,
    reset,
    resume,
    setGoal,
    setFreeDhikr,
    jump,
  };
}

export type TasbihSession = ReturnType<typeof useTasbih>;
