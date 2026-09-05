import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMosques } from '@/api/queries';
import type { Mosque } from '@/api/types';
import { MosqueCard } from '@/components/mosque/MosqueCard';
import { MosqueMap, type MosqueMapPin } from '@/components/mosque/MosqueMap';
import { AppText, EmptyState, ErrorState, Screen, Skeleton } from '@/components/ui';
import { useEidPeriod } from '@/hooks/useEidPeriod';
import { useFontScale } from '@/hooks/useFontScale';
import { usePlaces } from '@/hooks/usePlaces';
import { useRefresh } from '@/hooks/useRefresh';
import { useUserCoords } from '@/hooks/useUserCoords';
import { distanceKm } from '@/lib/geo';
import { jummahMissingForPlace } from '@/lib/jummahCopy';
import { placeSearchText, type Place } from '@/lib/places';
import { track } from '@/lib/telemetry';
import { useTheme } from '@/theme';
import { fontSize, opacity, radius, spacing } from '@/theme/tokens';
import { usePlaceFilter } from '@/store/placeFilter';
import { useSettings } from '@/store/settings';

type ViewMode = 'list' | 'map';
type SortMode = 'distance' | 'name';

type MosqueWithDistance = {
  mosque: Mosque;
  distance: number | null;
};

export default function MosquesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const coords = useUserCoords();
  const { isStacked } = useFontScale();
  const { data: mosques, isLoading, isError, refetch } = useMosques();
  const { places, byIso, selected: place } = usePlaces();
  const setPlaceIso = usePlaceFilter((state) => state.setPlaceIso);
  const [mode, setMode] = useState<ViewMode>('list');
  const [sort, setSort] = useState<SortMode>('distance');
  const [query, setQuery] = useState('');
  const { refreshing, onRefresh } = useRefresh();
  const eidPeriod = useEidPeriod();
  const selected = useSettings((state) => state.mosque);
  const selectedOrgNr = selected?.orgNr;
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
        })),
    [visible],
  );

  const mapCenter = place ? { lat: place.lat, lon: place.lon } : { lat: coords.lat, lon: coords.lon };

  const emptyMessage = place
    ? query.trim()
      ? `Ingen moskeer i ${place.name} matcher «${query.trim()}»`
      : `Vi har ingen registrerte moskeer i ${place.name}`
    : query.trim()
      ? `Ingen moskeer matcher «${query.trim()}»`
      : 'Ingen moskeer funnet i nærheten';

  return (
    <Screen padded={false} edges={[]} maxWidth={mode === 'map' ? null : undefined}>
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
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Søk etter moské, sted eller kommune"
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
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={theme.colors.textMuted} />
              </Pressable>
            )}
          </View>
          <ModeToggle mode={mode} onChange={setMode} />
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
              label="Nærmest meg"
              icon="navigate-outline"
              active={sort === 'distance'}
              onPress={() => setSort('distance')}
            />
            <SortChip
              label="Navn A–Å"
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

      {!isLoading && !isError && mode === 'list' && (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.mosque.org_nr}
          keyboardDismissMode="on-drag"
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
          renderItem={({ item }) => (
            <MosqueCard
              mosque={item.mosque}
              distanceKm={item.distance ?? undefined}
              eidPeriod={eidPeriod}
              showMissingJummah={place != null}
              place={place ? undefined : (item.mosque.post?.city ?? undefined)}
              selected={item.mosque.org_nr === selectedOrgNr}
              onPress={() => openMosque(item.mosque.org_nr)}
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

      {!isLoading && !isError && mode === 'map' && (
        <MosqueMap
          key={placeIso ?? 'all'}
          pins={pins}
          center={mapCenter}
          onSelect={openMosque}
        />
      )}
    </Screen>
  );
}

function PlaceFilterButton({
  place,
  disabled,
  onPress,
  onClear,
}: {
  place: Place | null;
  disabled: boolean;
  onPress: () => void;
  onClear: () => void;
}) {
  const theme = useTheme();
  const active = place != null;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={active ? `Filtrer på sted, ${place.name}` : 'Filtrer på sted'}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.md,
          borderRadius: radius.md,
          backgroundColor: active ? theme.colors.filterActiveSurface : theme.colors.filterSurface,
          borderWidth: 1,
          borderColor: active ? theme.colors.filterActiveBorder : theme.colors.filterBorder,
          minHeight: 40,
          opacity: disabled ? opacity.disabled : 1,
        },
        pressed && { opacity: opacity.pressed },
      ]}>
      <Ionicons
        name="funnel-outline"
        size={15}
        color={active ? theme.colors.filterActiveText : theme.colors.textMuted}
      />
      <AppText
        size="sm"
        weight={active ? 'semibold' : 'regular'}
        color={active ? theme.colors.filterActiveText : theme.colors.textSecondary}
        numberOfLines={1}
        style={{ flexShrink: 1 }}>
        {active ? place.name : 'Alle steder'}
      </AppText>
      {active ? (
        <Pressable onPress={onClear} hitSlop={8} accessibilityLabel="Fjern stedsfilter">
          <Ionicons name="close-circle" size={16} color={theme.colors.filterActiveText} />
        </Pressable>
      ) : (
        <Ionicons name="chevron-down" size={14} color={theme.colors.textMuted} />
      )}
    </Pressable>
  );
}

function SortChip({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.md,
          borderRadius: radius.full,
          backgroundColor: active ? theme.colors.primarySoft : theme.colors.surfaceSunken,
          borderWidth: 1,
          borderColor: active ? theme.colors.primary : 'transparent',
          minHeight: 40,
        },
        pressed && { opacity: opacity.pressed },
      ]}>
      <Ionicons
        name={icon}
        size={15}
        color={active ? theme.colors.onPrimarySoft : theme.colors.textMuted}
      />
      <AppText
        size="sm"
        weight={active ? 'semibold' : 'regular'}
        tone={active ? 'onPrimarySoft' : 'textSecondary'}
        numberOfLines={1}
        style={{ flexShrink: 1 }}>
        {label}
      </AppText>
    </Pressable>
  );
}

function ModeToggle({ mode, onChange }: { mode: ViewMode; onChange: (mode: ViewMode) => void }) {
  const theme = useTheme();

  const options: { value: ViewMode; icon: keyof typeof Ionicons.glyphMap }[] = [
    { value: 'list', icon: 'list' },
    { value: 'map', icon: 'map-outline' },
  ];

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: theme.colors.surfaceSunken,
        borderRadius: radius.full,
        padding: spacing.xxs,
      }}>
      {options.map((option) => {
        const isActive = option.value === mode;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              {
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.lg,
                borderRadius: radius.full,
                backgroundColor: isActive ? theme.colors.surface : 'transparent',
              },
              pressed && { opacity: opacity.pressed },
            ]}>
            <Ionicons
              name={option.icon}
              size={18}
              color={isActive ? theme.colors.primary : theme.colors.textMuted}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
