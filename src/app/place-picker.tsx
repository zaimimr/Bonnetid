import { useMemo, useState } from 'react';
import { Pressable, SectionList, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText, EmptyState, ErrorState, ListRow, Screen, Skeleton } from '@/components/ui';
import { useFontScale } from '@/hooks/useFontScale';
import { usePlaces } from '@/hooks/usePlaces';
import { groupPlacesByFylke, matchesPlace, placeCountLabel, type Place } from '@/lib/places';
import { track } from '@/lib/telemetry';
import { useTheme } from '@/theme';
import { fontSize, opacity, radius, spacing } from '@/theme/tokens';
import { usePlaceFilter } from '@/store/placeFilter';
import { useActiveLocation } from '@/store/settings';

export default function PlacePickerScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { isStacked } = useFontScale();
  const { scope } = useLocalSearchParams<{ scope?: string }>();
  const forTimes = scope === 'times';
  const activeLocation = useActiveLocation();
  const { places, isLoading, isError } = usePlaces(forTimes ? 'times' : 'mosques');
  const placeIso = usePlaceFilter((state) => (forTimes ? state.timesPlaceIso : state.placeIso));
  const setPlaceIso = usePlaceFilter((state) =>
    forTimes ? state.setTimesPlaceIso : state.setPlaceIso,
  );
  const [query, setQuery] = useState('');

  const sections = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return groupPlacesByFylke(places.filter((place) => matchesPlace(place, normalized)));
  }, [places, query]);

  const totalMatches = useMemo(
    () => sections.reduce((sum, section) => sum + section.data.length, 0),
    [sections],
  );

  const choose = (place: Place) => {
    setPlaceIso(place.iso);
    track(forTimes ? 'prayer_times_place_selected' : 'mosque_place_selected', {
      iso: place.iso,
      mosques: place.mosqueCount,
    });
    router.back();
  };

  const clear = () => {
    setPlaceIso(null);
    track(forTimes ? 'prayer_times_place_cleared' : 'mosque_place_cleared');
    router.back();
  };

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
            placeholder="Søk etter sted, kommune eller fylke"
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
            <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Tøm søk">
              <Ionicons name="close-circle" size={18} color={theme.colors.textMuted} />
            </Pressable>
          )}
        </View>

        <Pressable
          onPress={clear}
          style={({ pressed }) => [
            {
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              backgroundColor:
                placeIso == null ? theme.colors.primarySoft : theme.colors.surfaceSunken,
              borderRadius: radius.md,
              padding: spacing.md,
              minHeight: 48,
            },
            pressed && { opacity: opacity.pressed },
          ]}>
          <Ionicons
            name={forTimes ? 'navigate-outline' : 'earth-outline'}
            size={18}
            color={placeIso == null ? theme.colors.onPrimarySoft : theme.colors.textSecondary}
          />
          <View style={{ flex: 1 }}>
            <AppText
              weight="semibold"
              tone={placeIso == null ? 'onPrimarySoft' : 'textPrimary'}
              numberOfLines={2}>
              {forTimes ? 'Mitt sted' : 'Alle steder'}
            </AppText>
            <AppText size="xs" tone={placeIso == null ? 'onPrimarySoft' : 'textMuted'}>
              {forTimes ? `Bønnetider for ${activeLocation.name}` : 'Vis moskeer i hele landet'}
            </AppText>
          </View>
          {placeIso == null && (
            <Ionicons name="checkmark-circle" size={22} color={theme.colors.onPrimarySoft} />
          )}
        </Pressable>

        {isLoading && (
          <View style={{ gap: spacing.md }}>
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} height={52} rounded="md" />
            ))}
          </View>
        )}

        {isError && <ErrorState />}

        {!isLoading && !isError && (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.iso}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets
            stickySectionHeadersEnabled={false}
            contentContainerStyle={{ paddingBottom: spacing.xxl }}
            renderSectionHeader={({ section }) => (
              <View
                style={{
                  paddingTop: spacing.lg,
                  paddingBottom: spacing.xs,
                  backgroundColor: theme.colors.background,
                }}>
                <AppText size="xs" weight="semibold" tone="textMuted">
                  {section.fylke.toUpperCase()}
                </AppText>
              </View>
            )}
            renderItem={({ item }) => (
              <ListRow
                title={item.name}
                subtitle={
                  forTimes
                    ? item.kommune !== item.name
                      ? item.kommune
                      : undefined
                    : isStacked
                      ? placeCountLabel(item.mosqueCount)
                      : item.kommune
                }
                trailing={
                  item.iso === placeIso ? (
                    <Ionicons name="checkmark-circle" size={22} color={theme.colors.primary} />
                  ) : isStacked || forTimes ? undefined : (
                    <AppText size="sm" tone="textMuted">
                      {placeCountLabel(item.mosqueCount)}
                    </AppText>
                  )
                }
                onPress={() => choose(item)}
              />
            )}
            ItemSeparatorComponent={() => (
              <View style={{ height: 1, backgroundColor: theme.colors.border }} />
            )}
            ListFooterComponent={
              totalMatches > 0 ? (
                <AppText
                  size="xs"
                  tone="textMuted"
                  align="center"
                  style={{ marginTop: spacing.xl }}>
                  {forTimes ? `${totalMatches} steder` : `${totalMatches} steder med registrerte moskeer`}
                </AppText>
              ) : null
            }
            ListEmptyComponent={
              <EmptyState message={`Ingen steder matcher «${query.trim()}»`} />
            }
          />
        )}
      </View>
    </Screen>
  );
}
