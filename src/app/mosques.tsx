import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMosques } from '@/api/queries';
import type { Mosque } from '@/api/types';
import { MosqueCard } from '@/components/mosque/MosqueCard';
import { MosqueMap, type MosqueMapPin } from '@/components/mosque/MosqueMap';
import { AppText, EmptyState, ErrorState, Screen, Skeleton } from '@/components/ui';
import { useIsEidPeriod } from '@/hooks/useIsEidPeriod';
import { useRefresh } from '@/hooks/useRefresh';
import { useUserCoords } from '@/hooks/useUserCoords';
import { distanceKm } from '@/lib/geo';
import { useTheme } from '@/theme';
import { fontSize, opacity, radius, spacing } from '@/theme/tokens';

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
  const { data: mosques, isLoading, isError, refetch } = useMosques();
  const [mode, setMode] = useState<ViewMode>('list');
  const [sort, setSort] = useState<SortMode>('distance');
  const [query, setQuery] = useState('');
  const { refreshing, onRefresh } = useRefresh();
  const isEidPeriod = useIsEidPeriod();

  const visible: MosqueWithDistance[] = useMemo(() => {
    if (!mosques) return [];
    const normalized = query.trim().toLowerCase();
    const withDistance = mosques
      .map((mosque) => ({
        mosque,
        distance:
          mosque.lat && mosque.lon
            ? distanceKm(coords.lat, coords.lon, Number(mosque.lat), Number(mosque.lon))
            : null,
      }))
      .filter(
        ({ mosque }) =>
          !normalized ||
          mosque.name.toLowerCase().includes(normalized) ||
          (mosque.post?.city.toLowerCase().includes(normalized) ?? false),
      );

    if (sort === 'name') {
      return withDistance.sort((a, b) => a.mosque.name.localeCompare(b.mosque.name, 'nb'));
    }
    return withDistance.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
  }, [mosques, query, sort, coords.lat, coords.lon]);

  const openMosque = (orgNr: string) =>
    router.push({ pathname: '/mosque/[orgNr]', params: { orgNr } });

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
              placeholder="Søk etter moské eller by"
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
            flexDirection: 'row',
            flexWrap: 'wrap',
            columnGap: spacing.sm,
            rowGap: spacing.sm,
            paddingBottom: spacing.md,
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
              showEid={isEidPeriod}
              onPress={() => openMosque(item.mosque.org_nr)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              message={query ? `Ingen moskeer matcher «${query}»` : 'Ingen moskeer funnet i nærheten'}
            />
          }
        />
      )}

      {!isLoading && !isError && mode === 'map' && (
        <MosqueMap pins={pins} center={{ lat: coords.lat, lon: coords.lon }} onSelect={openMosque} />
      )}

    </Screen>
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
