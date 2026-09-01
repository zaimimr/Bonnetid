import { useWindowDimensions } from 'react-native';

const WIDE_WIDTH = 700;
const CONTENT_MAX_WIDTH = 640;
const SHORT_HEIGHT = 700;

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  return {
    width,
    height,
    isLandscape: width > height,
    isWide: width >= WIDE_WIDTH,
    isShort: height < SHORT_HEIGHT,
    contentMaxWidth: CONTENT_MAX_WIDTH,
  };
}
