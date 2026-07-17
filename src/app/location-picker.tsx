import { useMemo, useState } from 'react';
import { FlatList, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLocations } from '@/api/queries';
import { AppText, ErrorState, ListRow, Screen, Skeleton } from '@/components/ui';
import { useTheme } from '@/theme';
import { fontSize, radius, spacing } from '@/theme/tokens';
import { useActiveLocation, useSettings } from '@/store/settings';

export default function LocationPickerScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { data: locations, isLoading, isError, refetch } = useLocations();
  const setLocation = useSettings((state) => state.setLocation);
  const active = useActiveLocation();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!locations) return [];
    const normalized = query.trim().toLowerCase();
    if (!normalized) return locations;
    return locations.filter(
      (location) =>
        location.name.toLowerCase().includes(normalized) ||
        location.fylke.toLowerCase().includes(normalized),
    );
  }, [locations, query]);

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
              subtitle={item.fylke}
              trailing={
                item.pk === active.pk ? (
                  <Ionicons name="checkmark-circle" size={22} color={theme.colors.primary} />
                ) : undefined
              }
              onPress={() => {
                setLocation({
                  pk: item.pk,
                  name: item.name,
                  lat: Number(item.lat),
                  lon: Number(item.lon),
                });
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
