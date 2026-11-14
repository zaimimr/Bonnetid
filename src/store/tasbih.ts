import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { TasbihGoal, TasbihSeries } from '@/lib/tasbih';

type TasbihStore = {
  series: TasbihSeries[];
  totals: Record<string, number>;
  freeGoal: TasbihGoal;
  colorLinked: boolean;
  saveSeries: (series: TasbihSeries) => void;
  deleteSeries: (id: string) => void;
  addToTotal: (key: string) => void;
  setFreeGoal: (goal: TasbihGoal) => void;
  setColorLinked: (colorLinked: boolean) => void;
};

export const useTasbihStore = create<TasbihStore>()(
  persist(
    (set) => ({
      series: [],
      totals: {},
      freeGoal: 33,
      colorLinked: true,
      saveSeries: (next) =>
        set((state) => ({
          series: state.series.some((item) => item.id === next.id)
            ? state.series.map((item) => (item.id === next.id ? next : item))
            : [...state.series, next],
        })),
      deleteSeries: (id) => set((state) => ({ series: state.series.filter((item) => item.id !== id) })),
      addToTotal: (key) =>
        set((state) => ({ totals: { ...state.totals, [key]: (state.totals[key] ?? 0) + 1 } })),
      setFreeGoal: (freeGoal) => set({ freeGoal }),
      setColorLinked: (colorLinked) => set({ colorLinked }),
    }),
    {
      name: 'bonnetid-tasbih',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      partialize: ({ series, totals, freeGoal, colorLinked }) => ({ series, totals, freeGoal, colorLinked }),
    },
  ),
);
