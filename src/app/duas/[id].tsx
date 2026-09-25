import { Platform, useWindowDimensions, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { AppText, Card, Divider, EmptyState, Screen } from '@/components/ui';
import { duaById } from '@/lib/duas';
import { fontSize, spacing } from '@/theme/tokens';

const ARABIC_SIZE = 'xxl';
const ARABIC_MAX_SCALE = 1.4;
const ARABIC_LINE_HEIGHT = 1.9;

export default function DuaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dua = id ? duaById(id) : null;
  const { fontScale } = useWindowDimensions();

  if (!dua) {
    return (
      <Screen edges={[]}>
        <EmptyState message="Fant ikke denne duaen" icon="book-outline" />
      </Screen>
    );
  }

  const scale = Platform.OS === 'ios' ? Math.min(Math.max(fontScale || 1, 1), ARABIC_MAX_SCALE) : 1;
  const details = [
    dua.repeat ? `Gjentas ${dua.repeat} ganger` : null,
    `Kilde: ${dua.source}`,
  ].filter((line): line is string => line !== null);

  return (
    <Screen scroll edges={[]}>
      <Stack.Screen options={{ title: dua.title }} />
      <Card rounded="xl" padding="lg" style={{ marginTop: spacing.lg }}>
        <AppText
          size={ARABIC_SIZE}
          maxFontSizeMultiplier={ARABIC_MAX_SCALE}
          align="right"
          style={{
            writingDirection: 'rtl',
            lineHeight: fontSize[ARABIC_SIZE] * ARABIC_LINE_HEIGHT * scale,
          }}>
          {dua.arabic}
        </AppText>

        <View style={{ marginVertical: spacing.lg }}>
          <Divider inset={0} />
        </View>

        <View style={{ gap: spacing.md }}>
          <AppText tone="textSecondary" style={{ fontStyle: 'italic' }}>
            {dua.transliteration}
          </AppText>
          <AppText>{dua.meaning}</AppText>
          {dua.note ? (
            <AppText size="sm" tone="textSecondary">
              {dua.note}
            </AppText>
          ) : null}
        </View>
      </Card>

      <View style={{ gap: spacing.xxs, marginTop: spacing.md, paddingHorizontal: spacing.xs }}>
        {details.map((line) => (
          <AppText key={line} size="sm" tone="textMuted">
            {line}
          </AppText>
        ))}
      </View>
    </Screen>
  );
}
