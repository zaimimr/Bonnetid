import { Platform, Pressable, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AppText, Card, Divider } from '@/components/ui';
import type { Dua } from '@/lib/duas';
import { useTheme } from '@/theme';
import { fontSize, opacity, radius, spacing } from '@/theme/tokens';

const ARABIC_SIZE = 'xxl';
const ARABIC_MAX_SCALE = 1.4;
const ARABIC_LINE_HEIGHT = 1.9;
const TRACK_HEIGHT = 6;

export type DuaCardProps = {
  dua: Dua;
  step?: string;
  count?: number;
  onCount?: () => void;
  onResetCount?: () => void;
};

export function DuaCard({ dua, step, count = 0, onCount, onResetCount }: DuaCardProps) {
  const theme = useTheme();
  const { fontScale } = useWindowDimensions();
  const scale = Platform.OS === 'ios' ? Math.min(Math.max(fontScale || 1, 1), ARABIC_MAX_SCALE) : 1;
  const target = dua.repeat ?? 0;
  const done = target > 0 && count >= target;

  const tap = () => {
    if (!onCount || done) return;
    const finishing = count + 1 >= target;
    Haptics.impactAsync(
      finishing ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light,
    ).catch(() => {});
    onCount();
  };

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
        {step && (
          <AppText size="xs" tone="textMuted" tabular>
            {step}
          </AppText>
        )}
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

      {target > 0 && onCount && (
        <Pressable
          onPress={tap}
          onLongPress={onResetCount}
          accessibilityRole="button"
          accessibilityLabel={
            done ? `${dua.title}, ferdig` : `Tell ${dua.title}, ${count} av ${target}`
          }
          accessibilityHint="Hold inne for å starte på nytt"
          style={({ pressed }) => [
            {
              marginTop: spacing.lg,
              borderRadius: radius.lg,
              padding: spacing.md,
              gap: spacing.sm,
              backgroundColor: done ? theme.colors.primary : theme.colors.primarySoft,
            },
            pressed && { opacity: opacity.pressed },
          ]}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: spacing.md,
            }}>
            <AppText weight="semibold" tone={done ? 'onPrimary' : 'onPrimarySoft'}>
              {done ? 'Ferdig' : count === 0 ? 'Trykk for å telle' : 'Trykk igjen'}
            </AppText>
            {done ? (
              <Ionicons name="checkmark-circle" size={22} color={theme.colors.onPrimary} />
            ) : (
              <AppText size="lg" weight="bold" tone="onPrimarySoft" tabular>
                {`${count} / ${target}`}
              </AppText>
            )}
          </View>
          {!done && (
            <View
              style={{
                height: TRACK_HEIGHT,
                borderRadius: radius.full,
                backgroundColor: theme.colors.surface,
                overflow: 'hidden',
              }}>
              <View
                style={{
                  height: '100%',
                  width: `${(count / target) * 100}%`,
                  backgroundColor: theme.colors.primary,
                }}
              />
            </View>
          )}
        </Pressable>
      )}
    </Card>
  );
}
