import { Fragment } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/icons';
import { AppText, Button, Card, Divider, IconTile, ListRow, Screen, SectionHeader } from '@/components/ui';
import { t } from '@/lib/i18n';
import {
  AFTER_PRAYER_ID,
  AFTER_PRAYER_STEPS,
  FREE_ID,
  currentStep,
  targetOf,
  type TasbihSeries,
  type TasbihStep,
} from '@/lib/tasbih';
import { useTasbihStore } from '@/store/tasbih';
import { useTheme } from '@/theme';
import { hitSlop, spacing } from '@/theme/tokens';
import { useSavedTasbih, useSeries } from './useTasbih';

function stepNames(steps: TasbihStep[]): string {
  return steps.map((step) => t(`tasbih.names.${step.dhikr}`)).join(' · ');
}

function ContinueCard() {
  const router = useRouter();
  const theme = useTheme();
  const saved = useSavedTasbih();
  const series = useSeries(saved?.series ?? '');
  if (!saved || (saved.series !== FREE_ID && !series)) return null;
  const steps = series?.steps ?? [];
  const step = currentStep(saved, steps);
  const target = targetOf(saved, steps);
  const name = step ? t(`tasbih.names.${step.dhikr}`) : t('tasbih.freeCount');

  return (
    <Card
      rounded="xl"
      onPress={() => router.push({ pathname: '/tasbih-count', params: { series: saved.series, resume: '1' } })}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <IconTile>
          <Icon name="tasbih" size={22} color={theme.colors.primary} />
        </IconTile>
        <View style={{ flex: 1, gap: spacing.xxs }}>
          <AppText size="sm" tone="textMuted">
            {t('tasbih.continue')}
          </AppText>
          <AppText size="lg" weight="semibold" numberOfLines={1}>
            {series?.name ?? t('tasbih.freeCount')}
          </AppText>
          <AppText size="sm" tone="textSecondary" tabular numberOfLines={1}>
            {target
              ? t('tasbih.continueAt', { name, count: saved.count, target })
              : t('tasbih.continueCount', { name, count: saved.count })}
          </AppText>
        </View>
      </View>
    </Card>
  );
}

export function TasbihLibrary({ from }: { from?: string }) {
  const router = useRouter();
  const custom = useTasbihStore((store) => store.series);
  const freeGoal = useTasbihStore((store) => store.freeGoal);
  const open = (series: string) =>
    router.push({ pathname: '/tasbih-count', params: from ? { series, from } : { series } });
  const all: TasbihSeries[] = [
    { id: AFTER_PRAYER_ID, name: t('tasbih.afterPrayer'), steps: AFTER_PRAYER_STEPS },
    ...custom,
  ];

  return (
    <Screen scroll edges={[]} contentStyle={{ gap: spacing.lg, paddingTop: spacing.lg }}>
      <ContinueCard />
      <Card padding="sm" rounded="xl">
        <ListRow
          title={t('tasbih.freeCount')}
          subtitle={freeGoal === null ? t('tasbih.noGoal') : t('tasbih.goalValue', { goal: freeGoal })}
          chevron
          onPress={() => open(FREE_ID)}
          style={{ paddingHorizontal: spacing.md }}
        />
      </Card>
      <View style={{ gap: spacing.sm }}>
        <SectionHeader title={t('tasbih.series')} />
        <Card padding="sm" rounded="xl">
          {all.map((series, index) => (
            <Fragment key={series.id}>
              {index > 0 && <Divider />}
              <ListRow
                title={series.name}
                subtitle={stepNames(series.steps)}
                chevron={series.id === AFTER_PRAYER_ID}
                trailing={
                  series.id === AFTER_PRAYER_ID ? undefined : (
                    <Pressable
                      hitSlop={hitSlop}
                      accessibilityRole="button"
                      onPress={() => router.push({ pathname: '/tasbih-series', params: { id: series.id } })}>
                      <AppText size="sm" weight="semibold" tone="primary">
                        {t('tasbih.edit')}
                      </AppText>
                    </Pressable>
                  )
                }
                onPress={() => open(series.id)}
                style={{ paddingHorizontal: spacing.md }}
              />
            </Fragment>
          ))}
        </Card>
        <Button
          label={t('tasbih.newSeries')}
          variant="secondary"
          onPress={() => router.push('/tasbih-series')}
        />
      </View>
    </Screen>
  );
}
