import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut, ReduceMotion } from 'react-native-reanimated';
import { AppText, Button, SegmentedControl } from '@/components/ui';
import { ArabicText } from '@/components/duas/ArabicText';
import { COMPLETION, type TasbihGoal, type TasbihMode } from '@/lib/tasbih';
import { useTheme } from '@/theme';
import { hitSlop, opacity, spacing } from '@/theme/tokens';
import { useTasbihReturn } from '@/store/tasbihReturn';
import type { TasbihSession } from './useTasbih';

const MODES: { value: TasbihMode; label: string }[] = [
  { value: 'sequence', label: 'Etter bønnen' },
  { value: 'free', label: 'Fri telling' },
];

const GOALS: { value: string; label: string }[] = [
  { value: '33', label: '33' },
  { value: '100', label: '100' },
  { value: 'none', label: 'Uten mål' },
];

function goalFrom(value: string): TasbihGoal {
  if (value === '33') return 33;
  if (value === '100') return 100;
  return null;
}

const fade = FadeIn.duration(250).reduceMotion(ReduceMotion.System);
const fadeOut = FadeOut.duration(150).reduceMotion(ReduceMotion.System);

function ResetButton({ onPress }: { onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel="Nullstill"
      style={({ pressed }) => ({ padding: 6, opacity: pressed ? opacity.pressed : 1 })}>
      <Ionicons name="refresh" size={24} color={theme.colors.primary} />
    </Pressable>
  );
}

function Done({ session, fromDuas }: { session: TasbihSession; fromDuas: boolean }) {
  const { state, reset } = session;
  const theme = useTheme();
  const router = useRouter();
  const setScrollPast = useTasbihReturn((store) => store.setScrollPast);
  const sequence = state.mode === 'sequence';

  return (
    <Animated.View
      entering={fade}
      exiting={fadeOut}
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: theme.colors.background,
          justifyContent: 'center',
          alignItems: 'center',
          gap: spacing.lg,
        },
      ]}>
      <Ionicons name="checkmark-circle" size={40} color={theme.colors.primary} />
      {sequence && COMPLETION ? (
        <View style={{ gap: spacing.sm, alignItems: 'center' }}>
          <AppText size="sm" tone="textMuted" align="center">
            Avslutt med
          </AppText>
          <ArabicText>{COMPLETION.arabic}</ArabicText>
          <AppText size="sm" tone="textSecondary" align="center">
            {COMPLETION.meaning}
          </AppText>
        </View>
      ) : (
        <AppText size="xl" weight="semibold" tabular>
          {state.count}
        </AppText>
      )}
      {fromDuas && sequence ? (
        <Button
          label="Ferdig"
          onPress={() => {
            setScrollPast(COMPLETION?.id ?? null);
            router.back();
          }}
        />
      ) : (
        <Button label="Begynn på nytt" variant="secondary" onPress={reset} />
      )}
    </Animated.View>
  );
}

export type TasbihShellProps = {
  session: TasbihSession;
  fromDuas?: boolean;
  children: ReactNode;
};

export function TasbihShell({ session, fromDuas = false, children }: TasbihShellProps) {
  const insets = useSafeAreaInsets();
  const { state, target, tap, reset, setMode, setGoal } = session;
  const untouched = state.count === 0 && state.step === 0;
  const label = target ? `Tell, ${state.count} av ${target}` : `Tell, ${state.count}`;

  return (
    <>
      <Stack.Screen options={{ headerRight: () => <ResetButton onPress={reset} /> }} />
      <View
        style={{
          flex: 1,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: insets.bottom + spacing.md,
          gap: spacing.sm,
        }}>
        <SegmentedControl value={state.mode} options={MODES} onChange={setMode} />
        {state.mode === 'free' ? (
          <Animated.View entering={fade} exiting={fadeOut}>
            <SegmentedControl
              value={state.goal === null ? 'none' : String(state.goal)}
              options={GOALS}
              onChange={(value) => setGoal(goalFrom(value))}
            />
          </Animated.View>
        ) : null}

        <View style={{ flex: 1 }}>
          <Pressable
            onPress={tap}
            disabled={state.done}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityElementsHidden={state.done}
            importantForAccessibility={state.done ? 'no-hide-descendants' : 'auto'}
            style={{ flex: 1 }}>
            {children}
          </Pressable>
          {state.done ? <Done session={session} fromDuas={fromDuas} /> : null}
        </View>

        <View style={{ height: 20, justifyContent: 'center' }}>
          {untouched && !state.done ? (
            <Animated.View entering={fade} exiting={fadeOut}>
              <AppText size="sm" tone="textMuted" align="center">
                Trykk hvor som helst for å telle
              </AppText>
            </Animated.View>
          ) : null}
        </View>
      </View>
    </>
  );
}
