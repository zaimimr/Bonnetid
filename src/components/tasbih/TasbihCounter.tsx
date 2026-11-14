import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut, ReduceMotion } from 'react-native-reanimated';
import { Icon, type IconName } from '@/components/icons';
import { AppText, Button } from '@/components/ui';
import { t } from '@/lib/i18n';
import { isFree } from '@/lib/tasbih';
import { useTheme } from '@/theme';
import { hitSlop, opacity, radius, spacing } from '@/theme/tokens';
import { Completion } from './Completion';
import { PhaseStrip } from './PhaseStrip';
import { PhraseBlock } from './PhraseBlock';
import { SettingsSheet } from './SettingsSheet';
import { TasbihRing } from './TasbihRing';
import type { TasbihSession } from './useTasbih';

const fade = FadeIn.duration(250).reduceMotion(ReduceMotion.System);
const fadeOut = FadeOut.duration(150).reduceMotion(ReduceMotion.System);

function HeaderIcon({ name, label, onPress }: { name: IconName; label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({ padding: 6, opacity: pressed ? opacity.pressed : 1 })}>
      <Icon name={name} size={24} color={theme.colors.primary} />
    </Pressable>
  );
}

function ResumeBanner({ session }: { session: TasbihSession }) {
  const theme = useTheme();
  const offer = session.resumeOffer;
  if (!offer) return null;
  const name = offer.dhikr ? t(`tasbih.names.${offer.dhikr}`) : t('tasbih.freeCount');

  return (
    <Animated.View
      entering={fade}
      exiting={fadeOut}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.md,
        borderRadius: radius.xl,
        backgroundColor: theme.colors.primarySoft,
        borderWidth: 1,
        borderColor: theme.colors.seriesLight,
      }}>
      <View style={{ flex: 1, gap: spacing.xxs }}>
        <AppText weight="semibold">{t('tasbih.resumeTitle')}</AppText>
        <AppText size="sm" tone="textSecondary" tabular numberOfLines={1}>
          {offer.target
            ? t('tasbih.continueAt', { name, count: offer.count, target: offer.target })
            : t('tasbih.continueCount', { name, count: offer.count })}
        </AppText>
      </View>
      <Button label={t('tasbih.continue')} size="sm" onPress={session.resume} style={{ borderRadius: radius.full }} />
    </Animated.View>
  );
}

export function TasbihCounter({ session, fromDuas = false }: { session: TasbihSession; fromDuas?: boolean }) {
  const insets = useSafeAreaInsets();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { state, series, target, phrase, tap, reset } = session;
  const free = isFree(state);
  const confirmReset = () => {
    if (state.count === 0 && state.step === 0 && !state.done) return;
    Alert.alert(t('tasbih.reset'), t('tasbih.resetBody'), [
      { text: t('tasbih.cancel'), style: 'cancel' },
      { text: t('tasbih.reset'), style: 'destructive', onPress: reset },
    ]);
  };
  const label = target ? t('tasbih.countOf', { count: state.count, target }) : t('tasbih.count', { count: state.count });

  return (
    <>
      <Stack.Screen
        options={{
          title: free ? t('tasbih.freeCount') : (series?.name ?? t('navigation.tasbih')),
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: spacing.xs }}>
              <HeaderIcon name="sliders-horizontal" label={t('tasbih.settings')} onPress={() => setSettingsOpen(true)} />
              <HeaderIcon name="arrow-clockwise" label={t('tasbih.reset')} onPress={confirmReset} />
            </View>
          ),
        }}
      />
      {state.done ? (
        <Completion session={session} fromDuas={fromDuas} onChangeGoal={() => setSettingsOpen(true)} />
      ) : (
        <View
          style={{
            flex: 1,
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.md,
            paddingBottom: insets.bottom + spacing.md,
            gap: spacing.md,
          }}>
          <ResumeBanner session={session} />
          {!free ? <PhaseStrip session={session} /> : null}
          <Pressable
            onPress={tap}
            accessibilityRole="button"
            accessibilityLabel={label}
            style={{ flex: 1, gap: spacing.md }}>
            {phrase ? (
              <View style={{ flexShrink: 1, justifyContent: 'center', minHeight: 120 }}>
                <PhraseBlock phrase={phrase} />
              </View>
            ) : null}
            <TasbihRing session={session} />
          </Pressable>
          <AppText size="sm" tone="textMuted" align="center" style={{ minHeight: 24 }}>
            {target === 1 ? t('tasbih.tapWhenDone') : t('tasbih.tapAnywhereToCount')}
          </AppText>
        </View>
      )}
      <SettingsSheet session={session} visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
