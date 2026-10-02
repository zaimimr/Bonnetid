import { View } from 'react-native';
import Animated, { FadeIn, FadeOut, ReduceMotion } from 'react-native-reanimated';
import { AppText } from '@/components/ui';
import { ArabicText } from '@/components/duas/ArabicText';
import type { TasbihPhrase } from '@/lib/tasbih';
import { useSettings } from '@/store/settings';
import { spacing } from '@/theme/tokens';

const enter = FadeIn.duration(400).delay(150).reduceMotion(ReduceMotion.System);
const leave = FadeOut.duration(150).reduceMotion(ReduceMotion.System);

export function PhraseBlock({
  phrase,
  note,
  compact = false,
  minHeight = 120,
}: {
  phrase: TasbihPhrase | null;
  note?: string;
  compact?: boolean;
  minHeight?: number;
}) {
  const showTransliteration = useSettings((state) => state.duaShowTransliteration);
  const showMeaning = useSettings((state) => state.duaShowMeaning);
  return (
    <View style={{ minHeight, justifyContent: 'center' }}>
      {phrase ? (
        <Animated.View key={phrase.arabic} entering={enter} exiting={leave} style={{ gap: compact ? spacing.sm : spacing.xxs }}>
          <ArabicText>{phrase.arabic}</ArabicText>
          {showTransliteration ? (
            <AppText
              size={compact ? 'sm' : 'md'}
              weight={compact ? 'regular' : 'semibold'}
              tone={compact ? 'textSecondary' : 'textPrimary'}
              align="center">
              {phrase.transliteration}
            </AppText>
          ) : null}
          {showMeaning ? (
            <AppText size="sm" tone="textMuted" align="center">
              {phrase.meaning}
            </AppText>
          ) : null}
          {note ? (
            <AppText size="xs" weight="semibold" tone="primary" align="center" style={{ marginTop: spacing.xs }}>
              {note}
            </AppText>
          ) : null}
        </Animated.View>
      ) : null}
    </View>
  );
}
