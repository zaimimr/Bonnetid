import { create } from 'zustand';

type HomeEditState = {
  editing: boolean;
  setEditing: (editing: boolean) => void;
};

export const useHomeEdit = create<HomeEditState>((set) => ({
  editing: false,
  setEditing: (editing) => set({ editing }),
}));
