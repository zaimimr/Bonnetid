import { Platform, useWindowDimensions, View } from 'react-native';
import { AppText, Badge, Card, Divider } from '@/components/ui';
import type { Dua } from '@/lib/duas';
import { fontSize, spacing } from '@/theme/tokens';

const ARABIC_SIZE = 'xxl';
const ARABIC_MAX_SCALE = 1.4;
const ARABIC_LINE_HEIGHT = 1.9;

export type DuaCardProps = {
  dua: Dua;
  step?: string;
};

export function DuaCard({ dua, step }: DuaCardProps) {
  const { fontScale } = useWindowDimensions();
  const scale = Platform.OS === 'ios' ? Math.min(Math.max(fontScale || 1, 1), ARABIC_MAX_SCALE) : 1;

  return (
    <Card rounded="xl" padding="lg">
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: spacing.md,
          marginBottom: spacing.md,
        }}>
        <AppText weight="semibold" style={{ flexShrink: 1 }}>
          {dua.title}
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          {dua.repeat ? <Badge label={`${dua.repeat}×`} variant="primary" /> : null}
          {step && (
            <AppText size="xs" tone="textMuted" tabular>
              {step}
            </AppText>
          )}
        </View>
      </View>

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

      <View style={{ marginVertical: spacing.md }}>
        <Divider inset={0} />
      </View>

      <View style={{ gap: spacing.sm }}>
        <AppText tone="textSecondary" style={{ fontStyle: 'italic' }}>
          {dua.transliteration}
        </AppText>
        <AppText>{dua.meaning}</AppText>
        {dua.note ? (
          <AppText size="sm" tone="textSecondary">
            {dua.note}
          </AppText>
        ) : null}
        <AppText size="xs" tone="textMuted">
          {`Kilde: ${dua.source}`}
        </AppText>
      </View>

    </Card>
  );
}
