import { useMemo, useState } from 'react';
import { Pressable, SectionList, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText, EmptyState, ErrorState, Screen, Skeleton } from '@/components/ui';
import { useFontScale } from '@/hooks/useFontScale';
import { usePlaces } from '@/hooks/usePlaces';
import { groupPlacesByFylke, matchesPlace, placeCountLabel, type Place } from '@/lib/places';
import { track } from '@/lib/telemetry';
import { useTheme } from '@/theme';
import { fontSize, opacity, radius, spacing } from '@/theme/tokens';
import { usePlaceFilter } from '@/store/placeFilter';
import { useActiveLocation } from '@/store/settings';
import { PostHogMaskView } from 'posthog-react-native';
import { t } from '@/lib/i18n';

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

  const searching = query.trim().length > 0;

  const defaultFylke = useMemo(() => {
    const iso = placeIso ?? (forTimes ? activeLocation.iso : null);
    return places.find((place) => place.iso === iso)?.fylke ?? null;
  }, [places, placeIso, forTimes, activeLocation.iso]);

  const [toggledFylker, setToggledFylker] = useState<Set<string> | null>(null);
  const openFylker = toggledFylker ?? new Set(defaultFylke ? [defaultFylke] : []);

  const toggleFylke = (fylke: string) => {
    const next = new Set(openFylker);
    if (next.has(fylke)) next.delete(fylke);
    else next.add(fylke);
    setToggledFylker(next);
  };

  const visibleSections = sections.map((section) => ({
    ...section,
    places: section.data,
    data: searching || openFylker.has(section.fylke) ? section.data : [],
  }));

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
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: radius.md,
            paddingHorizontal: spacing.md,
          }}>
          <Ionicons name="search" size={18} color={theme.colors.textMuted} />
          <PostHogMaskView style={{ flex: 1 }}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t('places.searchForAPlace')}
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
            <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel={t('places.clearSearch')}>
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
              backgroundColor: placeIso == null ? theme.colors.primarySoft : theme.colors.surface,
              borderWidth: 1,
              borderColor: placeIso == null ? theme.colors.primarySoft : theme.colors.border,
              borderRadius: radius.lg,
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
              {forTimes
                ? t('places.myLocation')
                : t('places.allPlaces')}
            </AppText>
            <AppText size="xs" tone={placeIso == null ? 'onPrimarySoft' : 'textMuted'}>
              {forTimes
                ? t('places.prayerTimesFor', { name: activeLocation.name })
                : t('places.showMosquesAcrossThe')}
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
            sections={visibleSections}
            keyExtractor={(item) => item.iso}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets
            stickySectionHeadersEnabled={false}
            contentContainerStyle={{ paddingBottom: spacing.xxl }}
            renderSectionHeader={({ section }) => {
              const isOpen = searching || openFylker.has(section.fylke);
              const chosen = section.places.find((place) => place.iso === placeIso);
              return (
                <Pressable
                  onPress={() => toggleFylke(section.fylke)}
                  disabled={searching}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: isOpen }}
                  style={({ pressed }) => [
                    {
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.md,
                      minHeight: 60,
                      paddingVertical: spacing.md,
                      paddingHorizontal: spacing.lg,
                      backgroundColor: theme.colors.surface,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      borderTopLeftRadius: radius.lg,
                      borderTopRightRadius: radius.lg,
                      borderBottomLeftRadius: isOpen ? 0 : radius.lg,
                      borderBottomRightRadius: isOpen ? 0 : radius.lg,
                    },
                    pressed && { opacity: opacity.pressed },
                  ]}>
                  <View style={{ flex: 1, gap: spacing.xxs }}>
                    <AppText size="lg" weight="semibold" numberOfLines={2}>
                      {section.fylke}
                    </AppText>
                    {chosen ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                        <Ionicons name="checkmark-circle" size={16} color={theme.colors.primary} />
                        <AppText size="sm" weight="medium" tone="primary" numberOfLines={1}>
                          {chosen.name}
                        </AppText>
                      </View>
                    ) : (
                      <AppText size="sm" tone="textMuted" tabular>
                        {forTimes
                          ? t('places.places', { length: section.places.length })
                          : placeCountLabel(
                              section.places.reduce((sum, place) => sum + place.mosqueCount, 0),
                            )}
                      </AppText>
                    )}
                  </View>
                  {!searching && (
                    <Ionicons
                      name={isOpen ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={theme.colors.textSecondary}
                    />
                  )}
                </Pressable>
              );
            }}
            renderItem={({ item, index, section }) => {
              const isSelected = item.iso === placeIso;
              const isLast = index === section.data.length - 1;
              const subtitle = forTimes && item.kommune !== item.name ? item.kommune : undefined;
              return (
                <View
                  style={{
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    borderLeftWidth: 1,
                    borderRightWidth: 1,
                    borderBottomWidth: isLast ? 1 : 0,
                    borderBottomLeftRadius: isLast ? radius.lg : 0,
                    borderBottomRightRadius: isLast ? radius.lg : 0,
                    paddingStart: spacing.lg,
                  }}>
                  <Pressable
                    onPress={() => choose(item)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    style={({ pressed }) => [
                      {
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing.md,
                        minHeight: 52,
                        paddingVertical: spacing.md,
                        paddingEnd: spacing.lg,
                        borderTopWidth: index > 0 ? 1 : 0,
                        borderTopColor: theme.colors.border,
                      },
                      pressed && { opacity: opacity.pressed },
                    ]}>
                    <View style={{ flex: 1, gap: spacing.xxs }}>
                      <AppText
                        weight={isSelected ? 'semibold' : 'regular'}
                        tone={isSelected ? 'primary' : 'textPrimary'}
                        numberOfLines={2}>
                        {item.name}
                      </AppText>
                      {subtitle ? (
                        <AppText size="sm" tone="textMuted" numberOfLines={1}>
                          {subtitle}
                        </AppText>
                      ) : null}
                      {!forTimes && isStacked ? (
                        <AppText size="sm" tone="textMuted">
                          {placeCountLabel(item.mosqueCount)}
                        </AppText>
                      ) : null}
                    </View>
                    {!forTimes && !isStacked && (
                      <AppText size="sm" tone="textMuted" tabular>
                        {placeCountLabel(item.mosqueCount)}
                      </AppText>
                    )}
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={22} color={theme.colors.primary} />
                    )}
                  </Pressable>
                </View>
              );
            }}
            renderSectionFooter={() => <View style={{ height: spacing.md }} />}
            ListHeaderComponent={<View style={{ height: spacing.xs }} />}
            ListFooterComponent={
              totalMatches > 0 ? (
                <AppText size="xs" tone="textMuted" align="center" style={{ marginTop: spacing.md }}>
                  {forTimes
                    ? t('places.places2', { totalMatches })
                    : t('places.placesWithRegisteredMosques', { totalMatches })}
                </AppText>
              ) : null
            }
            ListEmptyComponent={
              <EmptyState
                message={t('places.noPlacesMatch', { value: query.trim() })}
              />
            }
          />
        )}
      </View>
    </Screen>
  );
}
