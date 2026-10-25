import { create } from 'zustand';

export const useServiceStatus = create<{ down: boolean }>()(() => ({ down: false }));

export function setServiceDown(down: boolean) {
  if (useServiceStatus.getState().down !== down) useServiceStatus.setState({ down });
}
