import { useMemo } from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { mirrored } from '@/components/ui';
import type { DuaCategoryId } from '@/lib/duas';
import { useTheme } from '@/theme';
import { DUA_ART } from './duaArtData';

export function DuaArt({ id, height }: { id: DuaCategoryId; height: number }) {
  const { colors } = useTheme();
  const xml = useMemo(() => {
    const scene = DUA_ART[id];
    const fill = (fragment: string) =>
      fragment
        .replaceAll('{ink}', colors.artInk)
        .replaceAll('{gold}', colors.artGold)
        .replaceAll('{goldSoft}', colors.artGoldSoft)
        .replaceAll('{greenSoft}', colors.artGreenSoft);
    return (
      '<svg viewBox="0 0 400 240" preserveAspectRatio="xMaxYMid slice">' +
      fill(scene.under) +
      `<path d="${scene.d}" fill="${colors.artInk}"/>` +
      fill(scene.over) +
      '</svg>'
    );
  }, [id, colors]);

  return (
    <View
      pointerEvents="none"
      style={[{ position: 'absolute', end: 0, bottom: 0, height, aspectRatio: 5 / 3 }, mirrored]}>
      <SvgXml xml={xml} width="100%" height="100%" />
    </View>
  );
}
