import { useMemo, useState } from 'react';
import { FlatList, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMosquesNearby } from '@/api/queries';
import { AppText, ErrorState, ListRow, Screen, Skeleton } from '@/components/ui';
import { useUserCoords } from '@/hooks/useUserCoords';
import { distanceKm, formatDistance } from '@/lib/geo';
import { useTheme } from '@/theme';
import { fontSize, radius, spacing } from '@/theme/tokens';
import { useSettings } from '@/store/settings';

export default function MosquePickerScreen() {
  const router = useRouter();
  const theme = useTheme();
  const coords = useUserCoords();
  const { data: mosques, isLoading, isError, refetch } = useMosquesNearby(coords.lat, coords.lon);
  const selected = useSettings((state) => state.mosque);
  const setMosque = useSettings((state) => state.setMosque);
  const [query, setQuery] = useState('');

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
    return matches.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
  }, [mosques, query, coords.lat, coords.lon]);

  return (
    <Screen edges={[]} padded={false}>
      <View style={{ padding: spacing.lg, gap: spacing.md, flex: 1 }}>
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
          keyboardShouldPersistTaps="handled"
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
              onPress={() => {
                setMosque({ orgNr: item.mosque.org_nr, name: item.mosque.name });
                router.back();
              }}
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
