import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLocations } from '@/api/queries';
import type { ApiLocation } from '@/api/types';
import { AppText, ErrorState, ListRow, Screen, Skeleton } from '@/components/ui';
import { detectNearestLocation, toSavedLocation } from '@/hooks/useAutoLocation';
import { useRefresh } from '@/hooks/useRefresh';
import { distanceKm, formatDistance } from '@/lib/geo';
import { track, trackError } from '@/lib/telemetry';
import { useTheme } from '@/theme';
import { fontSize, opacity, radius, spacing } from '@/theme/tokens';
import { useActiveLocation, useSettings } from '@/store/settings';

export default function LocationPickerScreen() {
  const router = useRouter();
  const theme = useTheme();
  const active = useActiveLocation();
  const setLocation = useSettings((state) => state.setLocation);
  const { data: locations, isLoading, isError, refetch } = useLocations();
  const { refreshing, onRefresh } = useRefresh();
  const [query, setQuery] = useState('');
  const [locating, setLocating] = useState(false);
  const [failed, setFailed] = useState(false);

  const filtered = useMemo(() => {
    if (!locations) return [];
    const normalized = query.trim().toLowerCase();
    const matches = normalized
      ? locations.filter(
          (location) =>
            location.name.toLowerCase().includes(normalized) ||
            location.fylke.toLowerCase().includes(normalized),
        )
      : locations;

    const withDistance = matches.map((location) => ({
      location,
      distance: distanceKm(active.lat, active.lon, location.lat, location.lon),
    }));

    const mine = withDistance.findIndex((item) => item.location.iso === active.iso);
    if (mine <= 0) return withDistance;
    return [
      withDistance[mine],
      ...withDistance.slice(0, mine),
      ...withDistance.slice(mine + 1),
    ];
  }, [locations, query, active.iso, active.lat, active.lon]);

  const choose = (location: ApiLocation, method: 'list' | 'gps') => {
    setLocation(toSavedLocation(location));
    track('location_detected', { iso: location.iso, source: method });
    router.back();
  };

  const useMyPosition = async () => {
    if (!locations || locating) return;
    setLocating(true);
    setFailed(false);
    try {
      const detected = await detectNearestLocation(locations);
      if (!detected) {
        setFailed(true);
        return;
      }
      setLocation(detected);
      track('location_detected', { iso: detected.iso, source: 'picker' });
      router.back();
    } catch (error) {
      setFailed(true);
      trackError(error, 'location-picker');
    } finally {
      setLocating(false);
    }
  };

  return (
    <Screen edges={[]} padded={false}>
      <View style={{ padding: spacing.lg, gap: spacing.md, flex: 1 }}>
        <Pressable
          onPress={useMyPosition}
          disabled={locating || !locations}
          style={({ pressed }) => [
            {
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              backgroundColor: theme.colors.primarySoft,
              borderRadius: radius.md,
              padding: spacing.md,
              minHeight: 48,
            },
            pressed && { opacity: opacity.pressed },
          ]}>
          {locating ? (
            <ActivityIndicator size="small" color={theme.colors.onPrimarySoft} />
          ) : (
            <Ionicons name="navigate" size={18} color={theme.colors.onPrimarySoft} />
          )}
          <View style={{ flex: 1 }}>
            <AppText weight="semibold" tone="onPrimarySoft">
              Bruk min posisjon
            </AppText>
            <AppText size="xs" tone="onPrimarySoft">
              Finner kommunen du er i
            </AppText>
          </View>
        </Pressable>

        {failed && (
          <AppText size="sm" tone="danger">
            Fant ingen norsk kommune der du er. Velg by fra listen.
          </AppText>
        )}

        <View
          style={{
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
            placeholder="Søk etter by eller fylke"
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
        </View>

        {isLoading && (
          <View style={{ gap: spacing.md }}>
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} height={52} rounded="md" />
            ))}
          </View>
        )}

        {isError && <ErrorState onRetry={refetch} />}

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.location.iso}
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
          renderItem={({ item }) => (
            <ListRow
              title={item.location.name}
              subtitle={[item.location.fylke, formatDistance(item.distance)]
                .filter(Boolean)
                .join(' · ')}
              trailing={
                active.iso === item.location.iso ? (
                  <Ionicons name="checkmark-circle" size={22} color={theme.colors.primary} />
                ) : undefined
              }
              onPress={() => choose(item.location, 'list')}
            />
          )}
          ItemSeparatorComponent={() => (
            <View style={{ height: 1, backgroundColor: theme.colors.border }} />
          )}
          ListEmptyComponent={
            !isLoading && !isError ? (
              <AppText tone="textMuted" align="center" style={{ marginTop: spacing.xl }}>
                Ingen treff
              </AppText>
            ) : null
          }
        />
      </View>
    </Screen>
  );
}
