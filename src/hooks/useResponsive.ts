import { useWindowDimensions } from 'react-native';
import { useVerticalFold } from '@/hooks/useWindowGeometry';

const WIDE_WIDTH = 700;
const CONTENT_MAX_WIDTH = 640;
const SHORT_HEIGHT = 700;

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const fold = useVerticalFold();
  const paneWidth = fold ? Math.max(fold.start, width - fold.end) : width;

  return {
    width,
    height,
    paneWidth,
    isLandscape: width > height,
    isWide: paneWidth >= WIDE_WIDTH,
    isShort: height < SHORT_HEIGHT,
    contentMaxWidth: CONTENT_MAX_WIDTH,
  };
}
