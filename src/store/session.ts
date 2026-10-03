import { create } from 'zustand';

export type Interruption = 'review' | 'survey' | 'whats_new';

type SessionState = {
  interruption: Interruption | null;
  openedFromNotification: boolean;
  errorTracked: boolean;
  claimInterruption: (kind: Interruption) => boolean;
  setOpenedFromNotification: () => void;
  setErrorTracked: () => void;
};

export const useSession = create<SessionState>()((set, get) => ({
  interruption: null,
  openedFromNotification: false,
  errorTracked: false,
  claimInterruption: (kind) => {
    if (get().interruption != null) return false;
    set({ interruption: kind });
    return true;
  },
  setOpenedFromNotification: () => set({ openedFromNotification: true }),
  setErrorTracked: () => set({ errorTracked: true }),
}));
