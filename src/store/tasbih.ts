import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { DhikrId, TasbihGoal, TasbihSeries } from '@/lib/tasbih';
import { addDaily, type DailyTotals } from '@/lib/tasbihStats';

const RECENT_LIMIT = 8;

type TasbihStore = {
  series: TasbihSeries[];
  totals: Record<string, number>;
  daily: DailyTotals;
  freeGoal: TasbihGoal;
  freeDhikr: DhikrId;
  recent: DhikrId[];
  colorLinked: boolean;
  saveSeries: (series: TasbihSeries) => void;
  deleteSeries: (id: string) => void;
  addToTotal: (key: string) => void;
  setFreeGoal: (goal: TasbihGoal) => void;
  setFreeDhikr: (dhikr: DhikrId) => void;
  markRecent: (dhikr: DhikrId[]) => void;
  setColorLinked: (colorLinked: boolean) => void;
};

export const useTasbihStore = create<TasbihStore>()(
  persist(
    (set) => ({
      series: [],
      totals: {},
      daily: {},
      freeGoal: 33,
      freeDhikr: 'subhanallah',
      recent: [],
      colorLinked: true,
      saveSeries: (next) =>
        set((state) => ({
          series: state.series.some((item) => item.id === next.id)
            ? state.series.map((item) => (item.id === next.id ? next : item))
            : [...state.series, next],
        })),
      deleteSeries: (id) => set((state) => ({ series: state.series.filter((item) => item.id !== id) })),
      addToTotal: (key) =>
        set((state) => ({
          totals: { ...state.totals, [key]: (state.totals[key] ?? 0) + 1 },
          daily: addDaily(state.daily, key, new Date()),
        })),
      setFreeGoal: (freeGoal) => set({ freeGoal }),
      setFreeDhikr: (freeDhikr) => set({ freeDhikr }),
      markRecent: (dhikr) =>
        set((state) => ({
          recent: [...dhikr, ...state.recent.filter((id) => !dhikr.includes(id))].slice(0, RECENT_LIMIT),
        })),
      setColorLinked: (colorLinked) => set({ colorLinked }),
    }),
    {
      name: 'bonnetid-tasbih',
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      migrate: (persisted) => ({ daily: {}, freeDhikr: 'subhanallah', recent: [], ...(persisted as object) }) as unknown as TasbihStore,
      partialize: ({ series, totals, daily, freeGoal, freeDhikr, recent, colorLinked }) => ({
        series,
        totals,
        daily,
        freeGoal,
        freeDhikr,
        recent,
        colorLinked,
      }),
    },
  ),
);
