import { useWindowDimensions } from 'react-native';

const MAX_LAYOUT_SCALE = 1.6;
const STACK_THRESHOLD = 1.35;

export function useFontScale() {
  const { fontScale } = useWindowDimensions();
  const scale = Math.min(Math.max(fontScale || 1, 1), MAX_LAYOUT_SCALE);
  return { scale, isStacked: scale >= STACK_THRESHOLD };
}

export function scaleWidth(width: number, scale: number) {
  return Math.round(width * scale);
}
