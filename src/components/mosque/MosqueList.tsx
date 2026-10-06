import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { t } from '@/lib/i18n';
import { useMosques } from '@/api/queries';
import type { Mosque } from '@/api/types';
import { MosqueCard } from '@/components/mosque/MosqueCard';
import {
  ModeToggle,
  PickActions,
  PlaceFilterButton,
  SortChip,
  type MosqueViewMode,
} from '@/components/mosque/MosqueListControls';
import { MosqueMap, type MosqueMapPin } from '@/components/mosque/MosqueMap';
import { AppText, EmptyState, ErrorState, Screen, Skeleton } from '@/components/ui';
import { useEidPeriod } from '@/hooks/useEidPeriod';
import { useFontScale } from '@/hooks/useFontScale';
import { useDevicePosition } from '@/hooks/useNearestLocation';
import { usePlaces } from '@/hooks/usePlaces';
import { useRefresh } from '@/hooks/useRefresh';
import { useUserCoords } from '@/hooks/useUserCoords';
import { distanceKm } from '@/lib/geo';
import { jummahMissingForPlace } from '@/lib/jummahCopy';
import { placeSearchText } from '@/lib/places';
import { track } from '@/lib/telemetry';
import { useTheme } from '@/theme';
import { fontSize, radius, spacing } from '@/theme/tokens';
import { usePlaceFilter } from '@/store/placeFilter';
import { useIsCalculatedMode, useSettings } from '@/store/settings';
import { PostHogMaskView } from 'posthog-react-native';

export type MosqueListMode = 'browse' | 'pick';

type SortMode = 'distance' | 'name';
type SelectMethod = 'list' | 'gps' | 'map';

type MosqueWithDistance = {
  mosque: Mosque;
  distance: number | null;
};

const CALCULATED_MESSAGE: Record<MosqueListMode, string> = t('mosque.calculatedMessage', { returnObjects: true });

export function MosqueList({ mode }: { mode: MosqueListMode }) {
  const picking = mode === 'pick';
  const router = useRouter();
  const theme = useTheme();
  const coords = useUserCoords();
  const { isStacked } = useFontScale();
  const { data: mosques, isLoading, isError, refetch } = useMosques();
  const { places, byIso, selected: place } = usePlaces();
  const setPlaceIso = usePlaceFilter((state) => state.setPlaceIso);
  const [view, setView] = useState<MosqueViewMode>('list');
  const [sort, setSort] = useState<SortMode>('distance');
  const [query, setQuery] = useState('');
  const { refreshing, onRefresh } = useRefresh();
  const { status: gpsStatus, getPosition } = useDevicePosition();
  const eidPeriod = useEidPeriod();
  const selected = useSettings((state) => state.mosque);
  const setMosque = useSettings((state) => state.setMosque);
  const selectedOrgNr = selected?.orgNr;
  const calculated = useIsCalculatedMode();
  const placeIso = place?.iso ?? null;

  const inPlace = useMemo(() => {
    if (!mosques) return [];
    if (!placeIso) return mosques;
    return mosques.filter((mosque) => mosque.location_iso === placeIso);
  }, [mosques, placeIso]);

  const visible: MosqueWithDistance[] = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const withDistance = inPlace
      .map((mosque) => ({
        mosque,
        distance:
          mosque.lat && mosque.lon
            ? distanceKm(coords.lat, coords.lon, Number(mosque.lat), Number(mosque.lon))
            : null,
      }))
      .filter(({ mosque }) => {
        if (!normalized) return true;
        if (mosque.name.toLowerCase().includes(normalized)) return true;
        if (mosque.post?.city.toLowerCase().includes(normalized)) return true;
        const home = mosque.location_iso ? byIso.get(mosque.location_iso) : undefined;
        return home ? placeSearchText(home).includes(normalized) : false;
      });

    const sorted =
      sort === 'name'
        ? withDistance.sort((a, b) => a.mosque.name.localeCompare(b.mosque.name, 'nb'))
        : withDistance.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));

    const mine = sorted.findIndex((item) => item.mosque.org_nr === selectedOrgNr);
    if (mine <= 0) return sorted;
    return [sorted[mine], ...sorted.slice(0, mine), ...sorted.slice(mine + 1)];
  }, [inPlace, byIso, query, sort, coords.lat, coords.lon, selectedOrgNr]);

  const withJummah = useMemo(
    () => inPlace.filter((mosque) => mosque.jummah.length > 0).length,
    [inPlace],
  );

  const openMosque = (orgNr: string) =>
    router.push({ pathname: '/mosque/[orgNr]', params: { orgNr } });

  const choose = (mosque: Mosque, method: SelectMethod) => {
    setMosque({ orgNr: mosque.org_nr, name: mosque.name });
    track('mosque_selected', { orgNr: mosque.org_nr, method });
    router.back();
  };

  const onSelectPin = (orgNr: string) => {
    if (!picking) {
      openMosque(orgNr);
      return;
    }
    const match = visible.find((item) => item.mosque.org_nr === orgNr);
    if (match) choose(match.mosque, 'map');
  };

  const useMyPosition = async () => {
    if (!mosques) return;
    const position = await getPosition();
    if (!position) return;
    let best: Mosque | null = null;
    let bestDistance = Infinity;
    for (const mosque of mosques) {
      if (mosque.lat == null || mosque.lon == null) continue;
      const distance = distanceKm(position.lat, position.lon, mosque.lat, mosque.lon);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = mosque;
      }
    }
    if (best) choose(best, 'gps');
  };

  const clearMosque = () => {
    setMosque(null);
    track('mosque_cleared');
    router.back();
  };

  const openPlacePicker = () => router.push('/place-picker');

  const clearPlace = () => {
    setPlaceIso(null);
    track('mosque_place_cleared');
  };

  const pins: MosqueMapPin[] = useMemo(
    () =>
      visible
        .filter((item) => item.mosque.lat != null && item.mosque.lon != null)
        .map((item) => ({
          orgNr: item.mosque.org_nr,
          name: item.mosque.name,
          address: item.mosque.address,
          lat: Number(item.mosque.lat),
          lon: Number(item.mosque.lon),
          distanceKm: item.distance,
        })),
    [visible],
  );

  const mapCenter = place ? { lat: place.lat, lon: place.lon } : { lat: coords.lat, lon: coords.lon };

  const search = query.trim();
  const emptyMessage = place
    ? search
      ? t('mosque.noMosquesInMatch', { name: place.name, search })
      : t('mosque.weHaveNoRegistered', { name: place.name })
    : search
      ? t('mosque.noMosquesMatch', { search })
      : t('mosque.noMosquesFoundNearby');

  if (calculated) {
    return (
      <Screen edges={[]}>
        <EmptyState message={CALCULATED_MESSAGE[mode]} icon="business-outline" />
      </Screen>
    );
  }

  return (
    <Screen padded={false} edges={[]} maxWidth={view === 'map' ? null : undefined}>
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              backgroundColor: theme.colors.surfaceSunken,
              borderRadius: radius.md,
              paddingHorizontal: spacing.md,
            }}>
            <Ionicons name="search" size={18} color={theme.colors.textMuted} />
            <PostHogMaskView style={{ flex: 1 }}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={t('mosque.searchForAMosque')}
                placeholderTextColor={theme.colors.textMuted}
                autoCorrect={false}
                maxFontSizeMultiplier={1.6}
                style={{
                  flex: 1,
                  paddingVertical: spacing.md,
                  fontSize: fontSize.md,
                  color: theme.colors.textPrimary,
                }}
              />
            </PostHogMaskView>
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel={t('mosque.clearSearch')}>
                <Ionicons name="close-circle" size={18} color={theme.colors.textMuted} />
              </Pressable>
            )}
          </View>
          <ModeToggle view={view} onChange={setView} />
        </View>

        <View
          style={{
            flexDirection: isStacked ? 'column' : 'row',
            alignItems: isStacked ? 'stretch' : 'center',
            flexWrap: isStacked ? 'nowrap' : 'wrap',
            columnGap: spacing.sm,
            rowGap: spacing.sm,
            paddingBottom: spacing.md,
          }}>
          <PlaceFilterButton
            place={place}
            disabled={places.length === 0}
            onPress={openPlacePicker}
            onClear={clearPlace}
          />
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              columnGap: spacing.sm,
              rowGap: spacing.sm,
            }}>
            <SortChip
              label={t('mosque.nearestMe')}
              icon="navigate-outline"
              active={sort === 'distance'}
              onPress={() => setSort('distance')}
            />
            <SortChip
              label={t('mosque.nameAZ')}
              icon="text-outline"
              active={sort === 'name'}
              onPress={() => setSort('name')}
            />
          </View>
        </View>
      </View>

      {isLoading && (
        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} height={84} rounded="xl" />
          ))}
        </View>
      )}

      {isError && <ErrorState onRetry={refetch} />}

      {!isLoading && !isError && view === 'list' && (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.mosque.org_nr}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.xxxl,
            gap: spacing.md,
          }}
          ListHeaderComponent={
            picking ? (
              <PickActions
                gpsStatus={gpsStatus}
                onUsePosition={useMyPosition}
                disabled={!mosques}
                selectedName={selected?.name ?? null}
                onClear={clearMosque}
              />
            ) : null
          }
          renderItem={({ item }) => (
            <MosqueCard
              mosque={item.mosque}
              distanceKm={item.distance ?? undefined}
              eidPeriod={eidPeriod}
              showMissingJummah={place != null}
              place={place ? undefined : (item.mosque.post?.city ?? undefined)}
              selected={item.mosque.org_nr === selectedOrgNr}
              accessory={picking ? (item.mosque.org_nr === selectedOrgNr ? 'check' : 'none') : 'chevron'}
              onPress={() =>
                picking ? choose(item.mosque, 'list') : openMosque(item.mosque.org_nr)
              }
            />
          )}
          ListFooterComponent={
            place && withJummah === 0 && visible.length > 0 ? (
              <AppText size="xs" tone="textMuted" style={{ marginTop: spacing.lg }}>
                {jummahMissingForPlace(place.name)}
              </AppText>
            ) : null
          }
          ListEmptyComponent={<EmptyState message={emptyMessage} />}
        />
      )}

      {!isLoading && !isError && view === 'map' && (
        <PostHogMaskView style={{ flex: 1 }}>
          <MosqueMap
            key={placeIso ?? 'all'}
            pins={pins}
            center={mapCenter}
            actionLabel={
              picking
                ? t('mosque.chooseThisMosque')
                : t('mosque.viewMosque')
            }
            myOrgNr={selectedOrgNr}
            fitToPins={place != null}
            onSelect={onSelectPin}
          />
        </PostHogMaskView>
      )}
    </Screen>
  );
}
