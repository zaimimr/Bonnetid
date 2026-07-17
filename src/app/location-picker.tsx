import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLocations } from '@/api/queries';
import type { ApiLocation } from '@/api/types';
import { AppText, ErrorState, ListRow, Screen, Skeleton } from '@/components/ui';
import { useNearestLocation } from '@/hooks/useNearestLocation';
import { useTheme } from '@/theme';
import { fontSize, opacity, radius, spacing } from '@/theme/tokens';
import { useActiveLocation, useSettings } from '@/store/settings';

function fylkeName(fylke: string): string {
  return fylke.replace(/^\d+\s*-\s*/, '');
}

export default function LocationPickerScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { data: locations, isLoading, isError, refetch } = useLocations();
  const setLocation = useSettings((state) => state.setLocation);
  const active = useActiveLocation();
  const [query, setQuery] = useState('');
  const { status: gpsStatus, locate } = useNearestLocation();

  const filtered = useMemo(() => {
    if (!locations) return [];
    const normalized = query.trim().toLowerCase();
    if (!normalized) return locations;
    return locations.filter(
      (location) =>
        location.name.toLowerCase().includes(normalized) ||
        fylkeName(location.fylke).toLowerCase().includes(normalized),
    );
  }, [locations, query]);

  const choose = (location: ApiLocation) => {
    setLocation({
      pk: location.pk,
      name: location.name,
      lat: Number(location.lat),
      lon: Number(location.lon),
    });
    router.back();
  };

  const useMyPosition = async () => {
    if (!locations) return;
    const nearest = await locate(locations);
    if (nearest) choose(nearest);
  };

  return (
    <Screen edges={[]} padded={false}>
      <View style={{ padding: spacing.lg, gap: spacing.md, flex: 1 }}>
        <Pressable
          onPress={useMyPosition}
          disabled={gpsStatus === 'locating' || !locations}
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
              Finner kommunen nærmest deg for nøyaktige bønnetider
            </AppText>
          </View>
        </Pressable>

        {gpsStatus === 'denied' && (
          <AppText size="sm" tone="danger">
            Posisjonstilgang avslått. Gi tilgang i systeminnstillinger, eller velg kommune manuelt.
          </AppText>
        )}
        {gpsStatus === 'error' && (
          <AppText size="sm" tone="danger">
            Fant ikke posisjonen din. Velg kommune manuelt.
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
            placeholder="Søk etter kommune"
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
              <Skeleton key={index} height={44} rounded="md" />
            ))}
          </View>
        )}

        {isError && <ErrorState onRetry={refetch} />}

        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.pk)}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <ListRow
              title={item.name}
              subtitle={fylkeName(item.fylke)}
              trailing={
                item.pk === active.pk ? (
                  <Ionicons name="checkmark-circle" size={22} color={theme.colors.primary} />
                ) : undefined
              }
              onPress={() => choose(item)}
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
