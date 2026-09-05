import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { HalalVerdict } from '@/lib/halalVerdict';

export type ScanEntry = {
  barcode: string;
  name: string | null;
  brand: string | null;
  verdict: HalalVerdict | null;
  at: number;
};

const MAX_ENTRIES = 40;

type ScanHistoryState = {
  entries: ScanEntry[];
  recordScan: (entry: ScanEntry) => void;
  clearHistory: () => void;
};

export const useScanHistory = create<ScanHistoryState>()(
  persist(
    (set) => ({
      entries: [],
      recordScan: (entry) =>
        set((state) => {
          const previous = state.entries.find((item) => item.barcode === entry.barcode);
          if (previous && previous.verdict === entry.verdict && previous.name === entry.name) {
            const reordered = [
              { ...previous, at: entry.at },
              ...state.entries.filter((item) => item.barcode !== entry.barcode),
            ];
            return { entries: reordered.slice(0, MAX_ENTRIES) };
          }
          const rest = state.entries.filter((item) => item.barcode !== entry.barcode);
          return { entries: [entry, ...rest].slice(0, MAX_ENTRIES) };
        }),
      clearHistory: () => set({ entries: [] }),
    }),
    {
      name: 'bonnetid-halal-scans',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      partialize: (state) => ({ entries: state.entries }),
    },
  ),
);
