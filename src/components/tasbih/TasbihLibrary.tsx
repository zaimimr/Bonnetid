import { useLayoutEffect } from 'react';
import { Pressable, View } from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { Icon } from '@/components/icons';
import { useNow } from '@/hooks/useNow';
import { AppText, Button, Screen, SectionHeader } from '@/components/ui';
import { t } from '@/lib/i18n';
import {
  AFTER_PRAYER_ID,
  AFTER_PRAYER_STEPS,
  FREE_ID,
  currentStep,
  seriesTotal,
  targetOf,
  type TasbihSeries,
} from '@/lib/tasbih';
import { dayCounts } from '@/lib/tasbihStats';
import { useTasbihStore } from '@/store/tasbih';
import { useTheme } from '@/theme';
import { hitSlop, opacity, radius, spacing } from '@/theme/tokens';
import { DashedButton } from './DashedButton';
import { useSavedTasbih, useSeries } from './useTasbih';

const NAMES_SHOWN = 3;

function NewSeriesButton({ onPress }: { onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={t('tasbih.newSeries')}
      style={({ pressed }) => ({ padding: 6, opacity: pressed ? opacity.pressed : 1 })}>
      <Icon name="plus-circle" size={24} color={theme.colors.primary} />
    </Pressable>
  );
}

function ContinueCard() {
  const router = useRouter();
  const theme = useTheme();
  const saved = useSavedTasbih();
  const series = useSeries(saved?.series ?? '');
  const freeDhikr = useTasbihStore((store) => store.freeDhikr);
  if (!saved || (saved.series !== FREE_ID && !series)) return null;
  const steps = series?.steps ?? [];
  const dhikr = saved.series === FREE_ID ? freeDhikr : currentStep(saved, steps)?.dhikr;
  const target = targetOf(saved, steps);
  const title = series?.name ?? t('tasbih.freeCount');
  const open = () => router.push({ pathname: '/tasbih-count', params: { series: saved.series, resume: '1' } });

  return (
    <View
      style={{
        gap: spacing.md,
        padding: spacing.lg,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: theme.colors.seriesLight,
        backgroundColor: theme.colors.primarySoft,
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.md }}>
        <View style={{ flex: 1, gap: spacing.xxs }}>
          <AppText size="sm" color={theme.colors.onPrimarySoft} numberOfLines={1}>
            {title}
          </AppText>
          <AppText size="xl" weight="bold" numberOfLines={1}>
            {dhikr ? t(`tasbih.names.${dhikr}`) : title}
          </AppText>
        </View>
        <AppText size="xxl" weight="bold" color={theme.colors.onPrimarySoft} tabular>
          {String(saved.count)}
          {target ? (
            <AppText size="md" tone="textSecondary" tabular>
              {` / ${target}`}
            </AppText>
          ) : null}
        </AppText>
      </View>
      {target ? (
        <View style={{ height: 8, borderRadius: radius.full, backgroundColor: theme.colors.surface, overflow: 'hidden' }}>
          <View
            style={{
              width: `${Math.min(saved.count / target, 1) * 100}%`,
              height: 8,
              borderRadius: radius.full,
              backgroundColor: theme.colors.primary,
            }}
          />
        </View>
      ) : null}
      <Button label={t('tasbih.continue')} onPress={open} fullWidth style={{ borderRadius: radius.full }} />
    </View>
  );
}

function StatsCard() {
  const router = useRouter();
  const theme = useTheme();
  const daily = useTasbihStore((store) => store.daily);
  const now = useNow(60_000);
  const days = dayCounts(daily, now, 7);
  const today = days[days.length - 1];
  const peak = Math.max(...days, 1);

  return (
    <Pressable
      onPress={() => router.push('/tasbih-stats')}
      accessibilityRole="button"
      accessibilityLabel={`${t('tasbih.stats')}, ${t('tasbih.today')} ${today}`}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        opacity: pressed ? opacity.pressed : 1,
      })}>
      <View style={{ flex: 1, gap: spacing.xxs }}>
        <AppText size="sm" tone="textMuted">
          {t('tasbih.today')}
        </AppText>
        <AppText size="xl" weight="bold" tabular>
          {String(today)}
        </AppText>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 36 }}>
        {days.map((count, index) => (
          <View
            key={index}
            style={{
              width: 8,
              height: Math.max((count / peak) * 36, 2),
              borderRadius: 2,
              backgroundColor: index === days.length - 1 ? theme.colors.primary : theme.colors.seriesLight,
            }}
          />
        ))}
      </View>
      <Icon name="caret-right" size={16} color={theme.colors.textMuted} />
    </Pressable>
  );
}

function FreeCountRow({ onPress }: { onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        minHeight: 56,
        paddingHorizontal: spacing.lg,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        opacity: pressed ? opacity.pressed : 1,
      })}>
      <AppText size="lg" weight="semibold" style={{ flex: 1 }} numberOfLines={1}>
        {t('tasbih.freeCount')}
      </AppText>
      <AppText size="sm" tone="textMuted">
        {t('tasbih.noGoal')}
      </AppText>
      <Icon name="caret-right" size={16} color={theme.colors.textMuted} />
    </Pressable>
  );
}

function SeriesBar({ series }: { series: TasbihSeries }) {
  const theme = useTheme();
  const colors = [theme.colors.primary, theme.colors.seriesMid, theme.colors.seriesLight, theme.colors.seriesGold];
  return (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      {series.steps.map((step, index) => (
        <View
          key={index}
          style={{ flex: step.target, height: 6, borderRadius: radius.full, backgroundColor: colors[index % colors.length] }}
        />
      ))}
    </View>
  );
}

function stepNames(series: TasbihSeries): string {
  const names = series.steps.slice(0, NAMES_SHOWN).map((step) => t(`tasbih.names.${step.dhikr}`));
  const rest = series.steps.length - NAMES_SHOWN;
  return [...names, ...(rest > 0 ? [t('tasbih.more', { count: rest })] : [])].join(' · ');
}

function SeriesCard({ series, onPress, onLongPress }: { series: TasbihSeries; onPress: () => void; onLongPress?: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        gap: spacing.sm,
        padding: spacing.lg,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        opacity: pressed ? opacity.pressed : 1,
      })}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.md }}>
        <AppText size="lg" weight="semibold" style={{ flex: 1 }} numberOfLines={1}>
          {series.name}
        </AppText>
        <AppText size="sm" tone="textMuted" tabular>
          {t('tasbih.times', { count: seriesTotal(series.steps) })}
        </AppText>
      </View>
      <SeriesBar series={series} />
      <AppText size="sm" tone="textSecondary" numberOfLines={1}>
        {stepNames(series)}
      </AppText>
    </Pressable>
  );
}

export function TasbihLibrary({ from }: { from?: string }) {
  const router = useRouter();
  const navigation = useNavigation();
  const custom = useTasbihStore((store) => store.series);
  const open = (series: string) =>
    router.push({ pathname: '/tasbih-count', params: from ? { series, from } : { series } });
  const create = () => router.push('/tasbih-series');
  const all: TasbihSeries[] = [
    { id: AFTER_PRAYER_ID, name: t('tasbih.afterPrayer'), steps: AFTER_PRAYER_STEPS },
    ...custom,
  ];

  useLayoutEffect(() => {
    navigation.setOptions({ headerRight: () => <NewSeriesButton onPress={() => router.push('/tasbih-series')} /> });
  }, [navigation, router]);

  return (
    <Screen scroll edges={[]} contentStyle={{ gap: spacing.xl, paddingTop: spacing.lg }}>
      <ContinueCard />
      <View style={{ gap: spacing.sm }}>
        <SectionHeader title={t('tasbih.series')} />
        {all.map((series) => (
          <SeriesCard
            key={series.id}
            series={series}
            onPress={() => open(series.id)}
            onLongPress={
              series.id === AFTER_PRAYER_ID
                ? undefined
                : () => router.push({ pathname: '/tasbih-series', params: { id: series.id } })
            }
          />
        ))}
        <FreeCountRow onPress={() => open(FREE_ID)} />
        {custom.length === 0 ? <DashedButton label={t('tasbih.newSeries')} onPress={create} /> : null}
      </View>
      <View style={{ gap: spacing.sm }}>
        <SectionHeader title={t('tasbih.stats')} />
        <StatsCard />
      </View>
    </Screen>
  );
}
