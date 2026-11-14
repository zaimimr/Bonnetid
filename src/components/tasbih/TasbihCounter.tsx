import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, FadeOut, ReduceMotion } from 'react-native-reanimated';
import { Icon, type IconName } from '@/components/icons';
import { AppText, Button } from '@/components/ui';
import { t } from '@/lib/i18n';
import { AFTER_PRAYER_ID, COMPLETION_DUA_ID, isFree } from '@/lib/tasbih';
import { useTasbihReturn } from '@/store/tasbihReturn';
import { useTheme } from '@/theme';
import { hitSlop, opacity, spacing } from '@/theme/tokens';
import { PhaseStrip } from './PhaseStrip';
import { PhraseBlock } from './PhraseBlock';
import { SettingsSheet } from './SettingsSheet';
import { TasbihRing } from './TasbihRing';
import type { TasbihSession } from './useTasbih';

const fade = FadeIn.duration(250).reduceMotion(ReduceMotion.System);
const fadeOut = FadeOut.duration(150).reduceMotion(ReduceMotion.System);
const rise = FadeInDown.duration(300).delay(250).reduceMotion(ReduceMotion.System);

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

function FinishAction({ session, fromDuas }: { session: TasbihSession; fromDuas: boolean }) {
  const router = useRouter();
  const setScrollPast = useTasbihReturn((store) => store.setScrollPast);

  if (fromDuas && session.state.series === AFTER_PRAYER_ID) {
    return (
      <Button
        label={t('tasbih.done')}
        onPress={() => {
          setScrollPast(COMPLETION_DUA_ID);
          router.back();
        }}
        style={{ alignSelf: 'center', minWidth: 200 }}
      />
    );
  }
  return (
    <Button
      label={t('tasbih.startOver')}
      variant="secondary"
      onPress={session.reset}
      style={{ alignSelf: 'center', minWidth: 200 }}
    />
  );
}

export function TasbihCounter({ session, fromDuas = false }: { session: TasbihSession; fromDuas?: boolean }) {
  const insets = useSafeAreaInsets();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { state, series, target, phrase, resumeOffer, tap, reset, resume } = session;
  const free = isFree(state);
  const label = target ? t('tasbih.countOf', { count: state.count, target }) : t('tasbih.count', { count: state.count });

  return (
    <>
      <Stack.Screen
        options={{
          title: free ? t('tasbih.freeCount') : (series?.name ?? t('navigation.tasbih')),
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: spacing.xs }}>
              <HeaderIcon name="sliders-horizontal" label={t('tasbih.settings')} onPress={() => setSettingsOpen(true)} />
              <HeaderIcon name="arrow-clockwise" label={t('tasbih.reset')} onPress={reset} />
            </View>
          ),
        }}
      />
      <View
        style={{
          flex: 1,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: insets.bottom + spacing.md,
          gap: spacing.md,
        }}>
        {!free ? <PhaseStrip session={session} /> : null}
        <Pressable
          onPress={tap}
          disabled={state.done}
          accessibilityRole="button"
          accessibilityLabel={label}
          style={{ flex: 1, gap: spacing.md }}>
          {phrase ? (
            <View style={{ flexShrink: 1, justifyContent: 'center', minHeight: 120 }}>
              <PhraseBlock phrase={phrase} note={target === 1 ? t('tasbih.saidOnce') : undefined} />
            </View>
          ) : null}
          <TasbihRing session={session} />
        </Pressable>
        <View style={{ minHeight: 52, justifyContent: 'center' }}>
          {state.done ? (
            <Animated.View entering={rise} exiting={fadeOut}>
              <FinishAction session={session} fromDuas={fromDuas} />
            </Animated.View>
          ) : resumeOffer ? (
            <Animated.View entering={fade} exiting={fadeOut}>
              <Button
                label={
                  resumeOffer.target
                    ? t('tasbih.resumeOf', { count: resumeOffer.count, target: resumeOffer.target })
                    : t('tasbih.resume', { count: resumeOffer.count })
                }
                variant="secondary"
                onPress={resume}
                style={{ alignSelf: 'center', minWidth: 200 }}
              />
            </Animated.View>
          ) : (
            <AppText size="sm" tone="textMuted" align="center">
              {t('tasbih.tapAnywhereToCount')}
            </AppText>
          )}
        </View>
      </View>
      <SettingsSheet session={session} visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
