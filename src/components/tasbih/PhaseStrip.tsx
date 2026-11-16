import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Icon } from '@/components/icons';
import { AppText, Sheet } from '@/components/ui';
import { t } from '@/lib/i18n';
import { stepFractions } from '@/lib/tasbih';
import { useTheme } from '@/theme';
import { opacity, radius, spacing } from '@/theme/tokens';
import type { TasbihSession } from './useTasbih';

export function InfoButton({ onPress }: { onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('tasbih.about')}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: radius.full,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.colors.seriesLight,
        backgroundColor: theme.colors.primarySoft,
        opacity: pressed ? opacity.pressed : 1,
      })}>
      <AppText size="lg" weight="bold" color={theme.colors.onPrimarySoft}>
        ?
      </AppText>
    </Pressable>
  );
}

export function PhaseStrip({ session, onInfo }: { session: TasbihSession; onInfo?: () => void }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const { state, steps, jump } = session;
  const fractions = stepFractions(state, steps);

  return (
    <>
      <View style={{ gap: spacing.xs }}>
        <Pressable
          onPress={() => setOpen(true)}
          accessible={false}
          style={({ pressed }) => ({ flexDirection: 'row', gap: 3, paddingHorizontal: 2, paddingVertical: spacing.xs, opacity: pressed ? opacity.pressed : 1 })}>
          {fractions.map((fraction, index) => (
            <View
              key={index}
              style={{
                flex: 1,
                height: 6,
                borderRadius: radius.full,
                backgroundColor: theme.colors.border,
                overflow: 'hidden',
                outlineWidth: index === state.step && !state.done ? 1.5 : 0,
                outlineColor: theme.colors.primary,
                outlineOffset: 2,
              }}>
              <View style={{ width: `${fraction * 100}%`, height: 6, backgroundColor: theme.colors.primary }} />
            </View>
          ))}
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Pressable
            onPress={() => setOpen(true)}
            accessibilityRole="button"
            accessibilityHint={t('tasbih.allSteps')}
            style={({ pressed }) => ({ flex: 1, minHeight: 44, justifyContent: 'center', opacity: pressed ? opacity.pressed : 1 })}>
            <AppText size="sm" tone="textMuted" tabular>
              {t('tasbih.stepLabel', { step: Math.min(state.step + 1, steps.length), total: steps.length })}
            </AppText>
          </Pressable>
          {onInfo ? (
            <InfoButton onPress={onInfo} />
          ) : null}
        </View>
      </View>
      <Sheet visible={open} onClose={() => setOpen(false)} title={session.series?.name ?? t('tasbih.allSteps')}>
        <View style={{ gap: spacing.xs }}>
          {steps.map((step, index) => {
            const current = index === state.step && !state.done;
            const finished = fractions[index] === 1;
            return (
              <Pressable
                key={index}
                onPress={() => {
                  jump(index);
                  setOpen(false);
                }}
                accessibilityRole="button"
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  padding: spacing.md,
                  borderRadius: radius.lg,
                  backgroundColor: current ? theme.colors.primarySoft : 'transparent',
                  opacity: pressed ? opacity.pressed : 1,
                })}>
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: radius.full,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: finished ? theme.colors.primary : theme.colors.surfaceSunken,
                  }}>
                  {finished ? (
                    <Icon name="check" size={16} color={theme.colors.onPrimary} />
                  ) : (
                    <AppText size="sm" weight="semibold" tabular>
                      {index + 1}
                    </AppText>
                  )}
                </View>
                <AppText weight={current ? 'semibold' : 'regular'} style={{ flex: 1 }} numberOfLines={1}>
                  {t(`tasbih.names.${step.dhikr}`)}
                </AppText>
                <AppText size="sm" tone="textMuted" tabular>
                  {current ? t('tasbih.stepOf', { step: state.count, total: step.target }) : step.target}
                </AppText>
              </Pressable>
            );
          })}
          <AppText size="sm" tone="textMuted" align="center" style={{ marginTop: spacing.sm }}>
            {t('tasbih.jumpHint')}
          </AppText>
        </View>
      </Sheet>
    </>
  );
}
