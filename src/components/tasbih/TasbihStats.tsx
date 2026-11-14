import { Fragment } from 'react';
import { View } from 'react-native';
import { useNow } from '@/hooks/useNow';
import { AppText, Card, Divider, Screen, SectionHeader } from '@/components/ui';
import { t } from '@/lib/i18n';
import { FREE_ID, isDhikrId } from '@/lib/tasbih';
import { allTimeCount, rankedTotals, todayCount, weekCount } from '@/lib/tasbihStats';
import { useTasbihStore } from '@/store/tasbih';
import { spacing } from '@/theme/tokens';

function Tile({ label, value }: { label: string; value: number }) {
  return (
    <Card rounded="xl" padding="md" style={{ flex: 1, gap: spacing.xxs }}>
      <AppText size="sm" tone="textMuted" numberOfLines={1}>
        {label}
      </AppText>
      <AppText size="xl" weight="bold" tabular numberOfLines={1} adjustsFontSizeToFit>
        {String(value)}
      </AppText>
    </Card>
  );
}

function nameOf(key: string): string {
  if (isDhikrId(key)) return t(`tasbih.names.${key}`);
  return key === FREE_ID ? t('tasbih.freeCount') : key;
}

export function TasbihStats() {
  const now = useNow(60_000);
  const totals = useTasbihStore((store) => store.totals);
  const daily = useTasbihStore((store) => store.daily);
  const ranked = rankedTotals(totals);

  return (
    <Screen scroll edges={[]} contentStyle={{ gap: spacing.lg, paddingTop: spacing.lg }}>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Tile label={t('tasbih.today')} value={todayCount(daily, now)} />
        <Tile label={t('tasbih.week')} value={weekCount(daily, now)} />
        <Tile label={t('tasbih.allTime')} value={allTimeCount(totals)} />
      </View>
      {ranked.length > 0 ? (
        <View style={{ gap: spacing.sm }}>
          <SectionHeader title={t('tasbih.perDhikr')} />
          <Card padding="sm" rounded="xl" style={{ paddingHorizontal: spacing.md }}>
            {ranked.map(([key, count], index) => (
              <Fragment key={key}>
                {index > 0 && <Divider />}
                <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 48, gap: spacing.md }}>
                  <AppText style={{ flex: 1 }} numberOfLines={1}>
                    {nameOf(key)}
                  </AppText>
                  <AppText tone="textMuted" tabular>
                    {String(count)}
                  </AppText>
                </View>
              </Fragment>
            ))}
          </Card>
        </View>
      ) : null}
    </Screen>
  );
}
