import { create } from 'zustand';

type TasbihReturnState = {
  scrollPast: string | null;
  setScrollPast: (duaId: string | null) => void;
};

export const useTasbihReturn = create<TasbihReturnState>()((set) => ({
  scrollPast: null,
  setScrollPast: (scrollPast) => set({ scrollPast }),
}));
