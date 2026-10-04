import { Fragment, type ReactNode } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMosque } from '@/api/queries';
import { Ionicons } from '@expo/vector-icons';
import { ArabicText } from '@/components/duas/ArabicText';
import { TasbihIcon } from '@/components/tasbih/TasbihIcon';
import { AppText, Card, Divider, ListRow } from '@/components/ui';
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
import { radius, spacing } from '@/theme/tokens';

const ICONS: Record<DuaCategoryId, keyof typeof Ionicons.glyphMap> = {
  'after-adhan': 'volume-high-outline',
  'wudu-mosque': 'water-outline',
  'after-salah': 'heart-outline',
  ramadan: 'moon-outline',
  eid: 'star-outline',
  hajj: 'cube-outline',
};

const TILE_SIZE = 40;

function Tile({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <View
      style={{
        width: TILE_SIZE,
        height: TILE_SIZE,
        borderRadius: radius.md,
        backgroundColor: theme.colors.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {children}
    </View>
  );
}

function CategoryIcon({ category }: { category: DuaCategory }) {
  const theme = useTheme();
  return (
    <Tile>
      <Ionicons
        name={ICONS[category.id]}
        size={20}
        color={category.season ? theme.colors.seasonHighlight : theme.colors.primary}
      />
    </Tile>
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
  const theme = useTheme();
  const tasbihEnabled = useFeature('tasbih');
  const { featured, others } = useHubCategories();
  const preview = featured ? duasIn(featured.id)[0] : null;
  const open = (id: DuaCategoryId) => router.push({ pathname: '/duas', params: { category: id } });

  return (
    <View style={{ gap: spacing.lg, marginTop: spacing.lg }}>
      {featured && (
        <Card rounded="xl" padding="lg" elevated onPress={() => open(featured.id)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <CategoryIcon category={featured} />
            <View style={{ flex: 1, gap: spacing.xxs }}>
              <AppText size="sm" tone="textMuted">
                Nå
              </AppText>
              <AppText size="lg" weight="semibold">
                {featured.title}
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
          </View>
          {preview && <ArabicText>{preview.arabic}</ArabicText>}
        </Card>
      )}

      {tasbihEnabled && (
        <Card padding="sm" rounded="xl">
          <ListRow
            title="Tasbih"
            leading={
              <Tile>
                <TasbihIcon size={22} color={theme.colors.primary} />
              </Tile>
            }
            chevron
            onPress={() => router.push('/tasbih')}
            style={{ paddingHorizontal: spacing.md }}
          />
        </Card>
      )}

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
