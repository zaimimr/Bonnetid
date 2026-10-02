import { View } from 'react-native';
import Animated, { FadeIn, FadeOut, ReduceMotion } from 'react-native-reanimated';
import { AppText } from '@/components/ui';
import { ArabicText } from '@/components/duas/ArabicText';
import type { TasbihPhrase } from '@/lib/tasbih';
import { spacing } from '@/theme/tokens';

const enter = FadeIn.duration(400).delay(150).reduceMotion(ReduceMotion.System);
const leave = FadeOut.duration(150).reduceMotion(ReduceMotion.System);

export function PhraseBlock({ phrase, minHeight = 120 }: { phrase: TasbihPhrase | null; minHeight?: number }) {
  return (
    <View style={{ minHeight, justifyContent: 'center' }}>
      {phrase ? (
        <Animated.View key={phrase.arabic} entering={enter} exiting={leave} style={{ gap: spacing.xxs }}>
          <ArabicText>{phrase.arabic}</ArabicText>
          <AppText weight="semibold" align="center">
            {phrase.transliteration}
          </AppText>
          <AppText size="sm" tone="textMuted" align="center">
            {phrase.meaning}
          </AppText>
        </Animated.View>
      ) : null}
    </View>
  );
}
