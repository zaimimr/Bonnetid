import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { readNativePrayerLog, writeNativePrayerLog } from '../../modules/prayer-widget';
import {
  mergePrayerLogs,
  parsePrayerLog,
  prayerLogKey,
  prayerLogsEqual,
  prunePrayerLog,
  type PrayerLog,
  type PrayerStatus,
} from '@/lib/prayerLog';

type PrayerLogState = {
  log: PrayerLog;
  setStatus: (isoDate: string, prayer: string, status: PrayerStatus | null) => void;
  syncFromNative: () => void;
};

export const usePrayerLog = create<PrayerLogState>()(
  persist(
    (set, get) => ({
      log: {},
      setStatus: (isoDate, prayer, status) => {
        const log = prunePrayerLog(
          { ...get().log, [prayerLogKey(isoDate, prayer)]: { status, at: Date.now() } },
          new Date(),
        );
        set({ log });
        writeNativePrayerLog(log);
      },
      syncFromNative: () => {
        const native = parsePrayerLog(readNativePrayerLog());
        const merged = prunePrayerLog(mergePrayerLogs(get().log, native), new Date());
        if (!prayerLogsEqual(merged, get().log)) set({ log: merged });
        if (!prayerLogsEqual(merged, native)) writeNativePrayerLog(merged);
      },
    }),
    {
      name: 'bonnetid-prayer-log',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      partialize: (state) => ({ log: state.log }),
      onRehydrateStorage: () => (state) => state?.syncFromNative(),
    },
  ),
);

export function usePrayerStatus(isoDate: string, prayer: string): PrayerStatus | null {
  return usePrayerLog((state) => state.log[prayerLogKey(isoDate, prayer)]?.status ?? null);
}
