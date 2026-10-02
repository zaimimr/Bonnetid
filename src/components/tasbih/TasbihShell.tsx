import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, FadeOut, ReduceMotion } from 'react-native-reanimated';
import { AppText, Button, SegmentedControl } from '@/components/ui';
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
const rise = FadeInDown.duration(300).delay(250).reduceMotion(ReduceMotion.System);

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

function FinishAction({ session, fromDuas }: { session: TasbihSession; fromDuas: boolean }) {
  const { state, reset } = session;
  const router = useRouter();
  const setScrollPast = useTasbihReturn((store) => store.setScrollPast);

  if (fromDuas && state.mode === 'sequence') {
    return (
      <Button
        label="Ferdig"
        onPress={() => {
          setScrollPast(COMPLETION?.id ?? null);
          router.back();
        }}
        style={{ alignSelf: 'center', minWidth: 200 }}
      />
    );
  }
  return (
    <Button
      label="Begynn på nytt"
      variant="secondary"
      onPress={reset}
      style={{ alignSelf: 'center', minWidth: 200 }}
    />
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

        <Pressable
          onPress={tap}
          disabled={state.done}
          accessibilityRole="button"
          accessibilityLabel={label}
          style={{ flex: 1 }}>
          {children}
        </Pressable>

        <View style={{ minHeight: 52, justifyContent: 'center' }}>
          {state.done ? (
            <Animated.View entering={rise} exiting={fadeOut}>
              <FinishAction session={session} fromDuas={fromDuas} />
            </Animated.View>
          ) : untouched ? (
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
