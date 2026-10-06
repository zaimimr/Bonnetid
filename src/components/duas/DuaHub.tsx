import { Fragment } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { t } from '@/lib/i18n';
import { useMosque } from '@/api/queries';
import { Ionicons } from '@expo/vector-icons';
import { ArabicText } from '@/components/duas/ArabicText';
import { TasbihIcon } from '@/components/tasbih/TasbihIcon';
import { AppText, Card, Divider, IconTile, ListRow, mirrored } from '@/components/ui';
import { useActiveDayKeys } from '@/hooks/useActiveDay';
import { useEidMode } from '@/hooks/useEidMode';
import { useFeature } from '@/hooks/useFeature';
import { useHijriSeasonNow } from '@/hooks/useHijriSeason';
import { useMosquePresence } from '@/hooks/useMosquePresence';
import { usePrayerDay } from '@/hooks/usePrayerDay';
import { zoneFor } from '@/hooks/usePrayerMonth';
import {
  DUA_CATEGORIES,
  duaCategoryForNow,
  duasIn,
  type DuaCategory,
  type DuaCategoryId,
} from '@/lib/duas';
import { adhanTimesFromSchedule, jamatTimesForDate } from '@/lib/prayerSchedule';
import { wallClockToDate } from '@/lib/time';
import { useActiveLocation } from '@/store/settings';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';

const ICONS: Record<DuaCategoryId, keyof typeof Ionicons.glyphMap> = {
  'after-adhan': 'volume-high-outline',
  'wudu-mosque': 'water-outline',
  'after-salah': 'heart-outline',
  ramadan: 'moon-outline',
  eid: 'star-outline',
  hajj: 'cube-outline',
};

function CategoryIcon({ category }: { category: DuaCategory }) {
  const theme = useTheme();
  return (
    <IconTile>
      <Ionicons
        name={ICONS[category.id]}
        size={20}
        color={category.season ? theme.colors.seasonHighlight : theme.colors.primary}
      />
    </IconTile>
  );
}

export function FeaturedCategoryCard({ category }: { category: DuaCategory }) {
  const router = useRouter();
  const theme = useTheme();
  const preview = duasIn(category.id)[0];
  return (
    <Card
      rounded="xl"
      padding="lg"
      elevated
      onPress={() => router.push({ pathname: '/duas', params: { category: category.id } })}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <CategoryIcon category={category} />
        <View style={{ flex: 1, gap: spacing.xxs }}>
          <AppText size="sm" tone="textMuted">
            {t('duas.now')}
          </AppText>
          <AppText size="lg" weight="semibold">
            {category.title}
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} style={mirrored} />
      </View>
      {preview && <ArabicText>{preview.arabic}</ArabicText>}
    </Card>
  );
}

export function TasbihRow({ from }: { from?: string }) {
  const router = useRouter();
  const theme = useTheme();
  return (
    <Card padding="sm" rounded="xl">
      <ListRow
        title={t('duas.tasbih')}
        leading={
          <IconTile>
            <TasbihIcon size={22} color={theme.colors.primary} />
          </IconTile>
        }
        chevron
        onPress={() => router.push({ pathname: '/tasbih', params: from ? { from } : {} })}
        style={{ paddingHorizontal: spacing.md }}
      />
    </Card>
  );
}

function useHubCategories() {
  const { now, status } = useHijriSeasonNow();
  const eidMode = useEidMode();
  const { nextPrayer, todaySchedule } = usePrayerDay(now);
  const presence = useMosquePresence();
  const location = useActiveLocation();
  const { isoDate } = useActiveDayKeys(now);
  const presenceDetails = useMosque(presence?.mosque.org_nr ?? '', { enabled: presence != null });
  const current = nextPrayer?.current ?? null;
  const jamatClock = current
    ? jamatTimesForDate(
        presenceDetails.data?.jamat,
        isoDate,
        adhanTimesFromSchedule(todaySchedule),
        presenceDetails.data?.jummah ?? [],
        now,
      )[current.name]
    : null;
  const jamatAt = jamatClock ? wallClockToDate(isoDate, jamatClock, zoneFor(location)) : null;

  const visible = DUA_CATEGORIES.filter(
    (entry) =>
      !entry.season ||
      entry.season === status?.id ||
      (entry.season === 'eid' && (status != null || eidMode != null)),
  );
  const nowId = duaCategoryForNow({
    eid: eidMode != null,
    sinceAdhanMs: current ? now.getTime() - current.date.getTime() : null,
    jamatAfterAdhanMs: current && jamatAt ? jamatAt.getTime() - current.date.getTime() : null,
    atMosque: presence != null,
    activeSeason: status?.isActive ? status.id : null,
  });
  const featured = visible.find((entry) => entry.id === nowId) ?? null;
  return { featured, others: visible.filter((entry) => entry.id !== featured?.id) };
}

export function DuaHub() {
  const router = useRouter();
  const tasbihEnabled = useFeature('tasbih');
  const { featured, others } = useHubCategories();
  const open = (id: DuaCategoryId) => router.push({ pathname: '/duas', params: { category: id } });

  return (
    <View style={{ gap: spacing.lg, marginTop: spacing.lg }}>
      {featured && <FeaturedCategoryCard category={featured} />}

      {tasbihEnabled && <TasbihRow />}

      <Card padding="sm" rounded="xl">
        {others.map((entry, index) => (
          <Fragment key={entry.id}>
            {index > 0 && <Divider />}
            <ListRow
              title={entry.title}
              leading={<CategoryIcon category={entry} />}
              trailing={
                <AppText size="sm" tone="textMuted" tabular>
                  {duasIn(entry.id).length}
                </AppText>
              }
              chevron
              onPress={() => open(entry.id)}
              style={{ paddingHorizontal: spacing.md }}
            />
          </Fragment>
        ))}
      </Card>
    </View>
  );
}
