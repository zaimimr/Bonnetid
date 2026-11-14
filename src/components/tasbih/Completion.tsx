import { Fragment, useEffect } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import { Icon } from '@/components/icons';
import { AppText, Button, Card, Divider } from '@/components/ui';
import { t } from '@/lib/i18n';
import { AFTER_PRAYER_ID, COMPLETION_DUA_ID, isFree } from '@/lib/tasbih';
import { useTasbihReturn } from '@/store/tasbihReturn';
import { useTheme } from '@/theme';
import { counterType, radius, spacing } from '@/theme/tokens';
import type { TasbihSession } from './useTasbih';

const CHECK = 72;

function CompleteCheck() {
  const theme = useTheme();
  const circle = useSharedValue(0);
  const tick = useSharedValue(0);

  useEffect(() => {
    circle.value = withSpring(1, { damping: 12, stiffness: 180, reduceMotion: ReduceMotion.System });
    tick.value = withDelay(180, withSpring(1, { damping: 9, stiffness: 220, reduceMotion: ReduceMotion.System }));
  }, [circle, tick]);

  const circleStyle = useAnimatedStyle(() => ({
    opacity: circle.value,
    transform: [{ scale: 0.3 + circle.value * 0.7 }],
  }));
  const tickStyle = useAnimatedStyle(() => ({
    opacity: tick.value,
    transform: [{ scale: tick.value }, { rotate: `${(1 - tick.value) * -25}deg` }],
  }));

  return (
    <Animated.View
      accessibilityLabel={t('tasbih.complete')}
      style={[
        {
          width: CHECK,
          height: CHECK,
          borderRadius: radius.full,
          backgroundColor: theme.colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: 'center',
        },
        circleStyle,
      ]}>
      <Animated.View style={tickStyle}>
        <Icon name="check" size={CHECK * 0.5} color={theme.colors.onPrimary} />
      </Animated.View>
    </Animated.View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44, gap: spacing.md }}>
      <AppText style={{ flexShrink: 1 }}>{label}</AppText>
      <AppText tone="textMuted" tabular>
        {value}
      </AppText>
    </View>
  );
}

function SeriesDone({ session, fromDuas }: { session: TasbihSession; fromDuas: boolean }) {
  const router = useRouter();
  const setScrollPast = useTasbihReturn((store) => store.setScrollPast);
  const { series, steps, reset } = session;
  const builtIn = series?.id === AFTER_PRAYER_ID;

  return (
    <>
      <View style={{ gap: spacing.md }}>
        <CompleteCheck />
        <View style={{ gap: spacing.xxs }}>
          <AppText size="xxl" weight="bold" align="center" heading>
            {series?.name ?? ''}
          </AppText>
          <AppText tone="textMuted" align="center">
            {t('tasbih.complete')}
          </AppText>
        </View>
      </View>
      <Card padding="sm" rounded="xl" style={{ paddingHorizontal: spacing.md }}>
        {steps.map((step, index) => (
          <Fragment key={index}>
            {index > 0 && <Divider />}
            <Row label={t(`tasbih.names.${step.dhikr}`)} value={t('tasbih.times', { count: step.target })} />
          </Fragment>
        ))}
      </Card>
      <View style={{ gap: spacing.sm }}>
        <Button
          label={fromDuas ? t('tasbih.backToDuas') : t('tasbih.done')}
          onPress={() => {
            if (fromDuas && builtIn) setScrollPast(COMPLETION_DUA_ID);
            router.back();
          }}
        />
        <Button label={builtIn ? t('tasbih.startOver') : t('tasbih.repeatSeries')} variant="ghost" onPress={reset} />
      </View>
    </>
  );
}

function FreeDone({ session, onChangeGoal }: { session: TasbihSession; onChangeGoal: () => void }) {
  const router = useRouter();
  const theme = useTheme();
  const { state, dhikr, today, total, reset } = session;

  return (
    <>
      <View style={{ gap: spacing.xxs }}>
        <Text
          maxFontSizeMultiplier={counterType.maxScale}
          style={{
            fontSize: counterType.size,
            fontWeight: '600',
            color: theme.colors.primary,
            fontVariant: ['tabular-nums'],
            textAlign: 'center',
          }}>
          {state.count}
        </Text>
        <AppText size="lg" weight="semibold" align="center">
          {dhikr ? t(`tasbih.names.${dhikr}`) : t('tasbih.freeCount')}
        </AppText>
      </View>
      <Card padding="sm" rounded="xl" style={{ paddingHorizontal: spacing.md }}>
        <Row label={t('tasbih.today')} value={String(today)} />
        <Divider />
        <Row label={t('tasbih.allTime')} value={String(total)} />
      </Card>
      <View style={{ gap: spacing.sm }}>
        <Button label={t('tasbih.onceMore')} onPress={reset} />
        <Button label={t('tasbih.changeGoal')} variant="secondary" onPress={onChangeGoal} />
        <Button label={t('tasbih.done')} variant="ghost" onPress={() => router.back()} />
      </View>
    </>
  );
}

export function Completion({
  session,
  fromDuas,
  onChangeGoal,
}: {
  session: TasbihSession;
  fromDuas: boolean;
  onChangeGoal: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: 'center',
        padding: spacing.lg,
        paddingBottom: insets.bottom + spacing.lg,
        gap: spacing.xl,
      }}>
      {isFree(session.state) ? (
        <FreeDone session={session} onChangeGoal={onChangeGoal} />
      ) : (
        <SeriesDone session={session} fromDuas={fromDuas} />
      )}
    </ScrollView>
  );
}
