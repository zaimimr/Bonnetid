import type { ReactNode } from 'react';
import { View } from 'react-native';
import { AppText, Badge, Card, Divider } from '@/components/ui';
import type { Dua } from '@/lib/duas';
import { useTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';
import { useSettings } from '@/store/settings';
import { ArabicText } from './ArabicText';

export type DuaCardProps = {
  dua: Dua;
  footer?: ReactNode;
};

export function DuaCard({ dua, footer }: DuaCardProps) {
  const theme = useTheme();
  const showTransliteration = useSettings((state) => state.duaShowTransliteration);
  const showMeaning = useSettings((state) => state.duaShowMeaning);

  return (
    <Card rounded="xl" padding="lg" style={{ gap: spacing.md }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.md,
        }}>
        <AppText weight="semibold" accessibilityRole="header" style={{ flexShrink: 1 }}>
          {dua.title}
        </AppText>
        {dua.repeat ? (
          <View accessible accessibilityLabel={`Gjentas ${dua.repeat} ganger`}>
            <Badge label={`${dua.repeat}×`} variant="primary" />
          </View>
        ) : null}
      </View>

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

      {showMeaning && (
        <>
          <Divider inset={0} />
          <AppText>{dua.meaning}</AppText>
        </>
      )}
      <AppText size="xs" tone="textMuted">
        {`Kilde: ${dua.source}`}
      </AppText>
      {footer}
    </Card>
  );
}
