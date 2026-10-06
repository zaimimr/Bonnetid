import { useEffect, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { windowGeometry, type WindowGeometry } from '../../modules/prayer-widget';

export type VerticalFold = { start: number; end: number };

function useWindowGeometry(): WindowGeometry | null {
  const { width, height } = useWindowDimensions();
  const [geometry, setGeometry] = useState<WindowGeometry | null>(null);

  useEffect(() => {
    let live = true;
    windowGeometry().then((next) => {
      if (live) setGeometry(next);
    });
    return () => {
      live = false;
    };
  }, [width, height]);

  return geometry;
}

export function useVerticalFold(): VerticalFold | null {
  const { width } = useWindowDimensions();
  const fold = useWindowGeometry()?.fold;
  if (!fold || fold.height <= fold.width || fold.x <= 0 || fold.x + fold.width >= width) {
    return null;
  }
  return { start: fold.x, end: fold.x + fold.width };
}

export function useScreenRotation(): number | null {
  return useWindowGeometry()?.rotation ?? null;
}
