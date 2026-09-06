import { ActivityIndicator, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui';
import type { GpsStatus } from '@/hooks/useNearestLocation';
import type { Place } from '@/lib/places';
import { useTheme } from '@/theme';
import { opacity, radius, spacing } from '@/theme/tokens';

export type MosqueViewMode = 'list' | 'map';

export function PickActions({
  gpsStatus,
  onUsePosition,
  disabled,
  selectedName,
  onClear,
}: {
  gpsStatus: GpsStatus;
  onUsePosition: () => void;
  disabled: boolean;
  selectedName: string | null;
  onClear: () => void;
}) {
  const theme = useTheme();

  return (
    <View style={{ gap: spacing.md }}>
      <Pressable
        onPress={onUsePosition}
        disabled={gpsStatus === 'locating' || disabled}
        accessibilityRole="button"
        accessibilityLabel="Bruk min posisjon, velger moskeen nærmest deg"
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

      {selectedName && (
        <Pressable
          onPress={onClear}
          accessibilityRole="button"
          accessibilityLabel="Fjern valgt moské"
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
              {selectedName}
            </AppText>
          </View>
        </Pressable>
      )}
    </View>
  );
}

export function PlaceFilterButton({
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

export function SortChip({
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
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
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

export function ModeToggle({ view, onChange }: { view: MosqueViewMode; onChange: (view: MosqueViewMode) => void }) {
  const theme = useTheme();

  const options: { value: MosqueViewMode; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
    { value: 'list', icon: 'list', label: 'Listevisning' },
    { value: 'map', icon: 'map-outline', label: 'Kartvisning' },
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
        const isActive = option.value === view;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityLabel={option.label}
            accessibilityState={{ selected: isActive }}
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
