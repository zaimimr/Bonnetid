import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Icon } from '@/components/icons';
import { AppText, Sheet } from '@/components/ui';
import { t } from '@/lib/i18n';
import { stepFractions } from '@/lib/tasbih';
import { useTheme } from '@/theme';
import { opacity, radius, spacing } from '@/theme/tokens';
import type { TasbihSession } from './useTasbih';

export function PhaseStrip({ session }: { session: TasbihSession }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const { state, steps, jump } = session;
  const fractions = stepFractions(state, steps);
  const next = steps[state.step + 1];

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={t('tasbih.allSteps')}
        style={({ pressed }) => ({ gap: spacing.sm, opacity: pressed ? opacity.pressed : 1 })}>
        <View style={{ flexDirection: 'row', gap: 3, paddingHorizontal: 2 }}>
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
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md }}>
          <AppText size="sm" weight="semibold" tabular>
            {t('tasbih.stepOf', { step: Math.min(state.step + 1, steps.length), total: steps.length })}
          </AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xxs, flexShrink: 1 }}>
            <AppText size="sm" tone="textMuted" numberOfLines={1}>
              {next ? t('tasbih.next', { name: t(`tasbih.names.${next.dhikr}`) }) : t('tasbih.last')}
            </AppText>
            <Icon name="caret-down" size={14} color={theme.colors.textMuted} />
          </View>
        </View>
      </Pressable>
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
