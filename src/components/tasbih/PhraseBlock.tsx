import { Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ReduceMotion } from 'react-native-reanimated';
import { isRTL, language } from '@/lib/i18n';
import { AppText } from '@/components/ui';
import { ArabicText } from '@/components/duas/ArabicText';
import { linkedParts, type TasbihPhrase } from '@/lib/tasbih';
import { useSettings } from '@/store/settings';
import { useTasbihStore } from '@/store/tasbih';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';

const enter = FadeIn.duration(400).delay(150).reduceMotion(ReduceMotion.System);
const leave = FadeOut.duration(150).reduceMotion(ReduceMotion.System);

export function PhraseBlock({ phrase, note }: { phrase: TasbihPhrase | null; note?: string }) {
  const theme = useTheme();
  const showTransliteration = useSettings((state) => state.duaShowTransliteration) && !isRTL();
  const showMeaning = useSettings((state) => state.duaShowMeaning) && language() !== 'ar';
  const colorLinked = useTasbihStore((state) => state.colorLinked);
  if (!phrase) return null;
  const parts = colorLinked ? linkedParts(phrase) : null;
  const tones = [theme.colors.primary, theme.colors.accent];

  return (
    <Animated.View key={phrase.arabic} entering={enter} exiting={leave} style={{ gap: spacing.xs }}>
      <ArabicText>
        {parts
          ? parts.arabic.map((part, index) => (
              <Text key={index} style={{ color: tones[index % 2] }}>
                {index > 0 ? '، ' : ''}
                {part}
              </Text>
            ))
          : phrase.arabic}
      </ArabicText>
      {showTransliteration ? (
        <AppText size="md" weight="semibold" align="center">
          {parts
            ? parts.transliteration.map((part, index) => (
                <Text key={index} style={{ color: tones[index % 2] }}>
                  {index > 0 ? ', ' : ''}
                  {part}
                </Text>
              ))
            : (
                <Text style={{ color: colorLinked ? theme.colors.primary : theme.colors.textPrimary }}>
                  {phrase.transliteration}
                </Text>
              )}
        </AppText>
      ) : null}
      {showMeaning ? (
        <AppText size="sm" tone="textMuted" align="center">
          {phrase.meaning}
        </AppText>
      ) : null}
      {note ? (
        <View style={{ marginTop: spacing.xs }}>
          <AppText size="xs" weight="semibold" tone="primary" align="center">
            {note}
          </AppText>
        </View>
      ) : null}
    </Animated.View>
  );
}
