import { useMemo, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMosquesNearby } from '@/api/queries';
import type { Mosque } from '@/api/types';
import { MosqueCard } from '@/components/mosque/MosqueCard';
import { AppText, EmptyState, ErrorState, Screen, Skeleton } from '@/components/ui';
import { useUserCoords } from '@/hooks/useUserCoords';
import { distanceKm } from '@/lib/geo';
import { useTheme } from '@/theme';
import { opacity, radius, spacing } from '@/theme/tokens';

type ViewMode = 'list' | 'map';

type MosqueWithDistance = {
  mosque: Mosque;
  distance: number | null;
};

export default function MosquesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const coords = useUserCoords();
  const { data: mosques, isLoading, isError, refetch } = useMosquesNearby(coords.lat, coords.lon);
  const [mode, setMode] = useState<ViewMode>('list');

  const sorted: MosqueWithDistance[] = useMemo(() => {
    if (!mosques) return [];
    return mosques
      .map((mosque) => ({
        mosque,
        distance:
          mosque.lat && mosque.lon
            ? distanceKm(coords.lat, coords.lon, Number(mosque.lat), Number(mosque.lon))
            : null,
      }))
      .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
  }, [mosques, coords.lat, coords.lon]);

  const openMosque = (mosque: Mosque) =>
    router.push({ pathname: '/mosque/[orgNr]', params: { orgNr: mosque.org_nr } });

  return (
    <Screen padded={false}>
      <View
        style={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.lg,
          paddingBottom: spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <AppText size="xxl" weight="bold" heading>
          Moskeer
        </AppText>
        <ModeToggle mode={mode} onChange={setMode} />
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
          data={sorted}
          keyExtractor={(item) => item.mosque.org_nr}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.xxxl,
            gap: spacing.md,
          }}
          renderItem={({ item }) => (
            <MosqueCard
              mosque={item.mosque}
              distanceKm={item.distance ?? undefined}
              onPress={() => openMosque(item.mosque)}
            />
          )}
          ListEmptyComponent={<EmptyState message="Ingen moskeer funnet i nærheten" />}
        />
      )}

      {!isLoading && !isError && mode === 'map' && (
        <MapView
          style={{ flex: 1 }}
          initialRegion={{
            latitude: coords.lat,
            longitude: coords.lon,
            latitudeDelta: 0.08,
            longitudeDelta: 0.08,
          }}
          showsUserLocation>
          {sorted
            .filter((item) => item.mosque.lat && item.mosque.lon)
            .map((item) => (
              <Marker
                key={item.mosque.org_nr}
                coordinate={{
                  latitude: Number(item.mosque.lat),
                  longitude: Number(item.mosque.lon),
                }}
                title={item.mosque.name}
                description={item.mosque.address ?? undefined}
                pinColor={theme.colors.primary}
                onCalloutPress={() => openMosque(item.mosque)}
              />
            ))}
        </MapView>
      )}
    </Screen>
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
