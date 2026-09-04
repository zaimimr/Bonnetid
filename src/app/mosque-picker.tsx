import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMosques } from '@/api/queries';
import type { Mosque } from '@/api/types';
import { AppText, ErrorState, ListRow, Screen, Skeleton } from '@/components/ui';
import { useDevicePosition } from '@/hooks/useNearestLocation';
import { useRefresh } from '@/hooks/useRefresh';
import { useUserCoords } from '@/hooks/useUserCoords';
import { distanceKm, formatDistance } from '@/lib/geo';
import { useTheme } from '@/theme';
import { fontSize, opacity, radius, spacing } from '@/theme/tokens';
import { useSettings } from '@/store/settings';

export default function MosquePickerScreen() {
  const router = useRouter();
  const theme = useTheme();
  const coords = useUserCoords();
  const { data: mosques, isLoading, isError, refetch } = useMosques();
  const selected = useSettings((state) => state.mosque);
  const setMosque = useSettings((state) => state.setMosque);
  const [query, setQuery] = useState('');
  const { status: gpsStatus, getPosition } = useDevicePosition();
  const { refreshing, onRefresh } = useRefresh();

  const filtered = useMemo(() => {
    if (!mosques) return [];
    const normalized = query.trim().toLowerCase();
    const withDistance = mosques.map((mosque) => ({
      mosque,
      distance:
        mosque.lat && mosque.lon
          ? distanceKm(coords.lat, coords.lon, Number(mosque.lat), Number(mosque.lon))
          : null,
    }));
    const matches = normalized
      ? withDistance.filter(({ mosque }) => mosque.name.toLowerCase().includes(normalized))
      : withDistance;
    const sorted = matches.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));

    const mine = sorted.findIndex((item) => item.mosque.org_nr === selected?.orgNr);
    if (mine <= 0) return sorted;
    return [sorted[mine], ...sorted.slice(0, mine), ...sorted.slice(mine + 1)];
  }, [mosques, query, coords.lat, coords.lon, selected?.orgNr]);

  const choose = (mosque: Mosque) => {
    setMosque({ orgNr: mosque.org_nr, name: mosque.name });
    router.back();
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
    if (best) choose(best);
  };

  return (
    <Screen edges={[]} padded={false}>
      <View style={{ padding: spacing.lg, gap: spacing.md, flex: 1 }}>
        <Pressable
          onPress={useMyPosition}
          disabled={gpsStatus === 'locating' || !mosques}
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
          {gpsStatus === 'locating' ? (
            <ActivityIndicator size="small" color={theme.colors.onPrimarySoft} />
          ) : (
            <Ionicons name="navigate" size={18} color={theme.colors.onPrimarySoft} />
          )}
          <View style={{ flex: 1 }}>
            <AppText weight="semibold" tone="onPrimarySoft">
              Bruk min posisjon
            </AppText>
            <AppText size="xs" tone="onPrimarySoft">
              Velger moskeen nærmest deg
            </AppText>
          </View>
        </Pressable>

        {gpsStatus === 'denied' && (
          <AppText size="sm" tone="danger">
            Posisjonstilgang avslått. Gi tilgang i systeminnstillinger, eller velg moské manuelt.
          </AppText>
        )}
        {gpsStatus === 'error' && (
          <AppText size="sm" tone="danger">
            Fant ikke posisjonen din. Velg moské manuelt.
          </AppText>
        )}

        {selected && (
          <Pressable
            onPress={() => {
              setMosque(null);
              router.back();
            }}
            style={({ pressed }) => [
              {
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                backgroundColor: theme.colors.surfaceSunken,
                borderRadius: radius.md,
                padding: spacing.md,
                minHeight: 48,
              },
              pressed && { opacity: opacity.pressed },
            ]}>
            <Ionicons name="close-circle-outline" size={18} color={theme.colors.danger} />
            <View style={{ flex: 1 }}>
              <AppText weight="semibold" tone="danger">
                Fjern valgt moské
              </AppText>
              <AppText size="xs" tone="textMuted">
                {selected.name}
              </AppText>
            </View>
          </Pressable>
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
            placeholder="Søk etter moské"
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
          keyExtractor={(item) => item.mosque.org_nr}
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
          renderItem={({ item }) => (
            <ListRow
              title={item.mosque.name}
              subtitle={[
                item.mosque.address,
                item.distance != null ? formatDistance(item.distance) : null,
              ]
                .filter(Boolean)
                .join(' · ')}
              trailing={
                selected?.orgNr === item.mosque.org_nr ? (
                  <Ionicons name="checkmark-circle" size={22} color={theme.colors.primary} />
                ) : undefined
              }
              onPress={() => choose(item.mosque)}
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
