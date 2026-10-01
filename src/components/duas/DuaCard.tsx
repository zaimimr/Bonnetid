import { View } from 'react-native';
import { AppText, Card, Divider } from '@/components/ui';
import type { Dua } from '@/lib/duas';
import { useTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';
import { useSettings } from '@/store/settings';
import { ArabicText } from './ArabicText';

export type DuaCardProps = {
  dua: Dua;
};

export function DuaCard({ dua }: DuaCardProps) {
  const theme = useTheme();
  const showTransliteration = useSettings((state) => state.duaShowTransliteration);

  return (
    <Card rounded="xl" padding="lg" style={{ gap: spacing.md }}>
      <AppText weight="semibold" accessibilityRole="header">
        {dua.title}
      </AppText>

      <View
        style={{
          backgroundColor: theme.colors.surfaceSunken,
          borderRadius: radius.lg,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
        }}>
        <ArabicText>{dua.arabic}</ArabicText>
      </View>

      {showTransliteration && (
        <AppText tone="textSecondary" accessibilityLabel={`Uttale: ${dua.transliteration}`}>
          {dua.transliteration}
        </AppText>
      )}

      <Divider inset={0} />

      <AppText>{dua.meaning}</AppText>
      <AppText size="xs" tone="textMuted">
        {`Kilde: ${dua.source}`}
      </AppText>
    </Card>
  );
}
