import { ActivityIndicator, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { t } from '@/lib/i18n';
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
        accessibilityLabel={t({
          nb: 'Bruk min posisjon, velger moskeen nærmest deg',
          en: 'Use my location, picks the mosque nearest you',
          ar: 'استخدام موقعي، يختار أقرب مسجد إليك',
          ur: 'میرا مقام استعمال کریں، آپ کے قریب ترین مسجد منتخب کرتا ہے',
        })}
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
            {t({ nb: 'Bruk min posisjon', en: 'Use my location', ar: 'استخدام موقعي', ur: 'میرا مقام استعمال کریں' })}
          </AppText>
          <AppText size="xs" tone="onPrimarySoft">
            {t({
              nb: 'Velger moskeen nærmest deg',
              en: 'Picks the mosque nearest you',
              ar: 'يختار أقرب مسجد إليك',
              ur: 'آپ کے قریب ترین مسجد منتخب کرتا ہے',
            })}
          </AppText>
        </View>
      </Pressable>

      {gpsStatus === 'denied' && (
        <AppText size="sm" tone="danger">
          {t({
            nb: 'Posisjonstilgang avslått. Gi tilgang i systeminnstillinger, eller velg moské manuelt.',
            en: 'Location access denied. Allow access in system settings, or choose a mosque manually.',
            ar: 'تم رفض الوصول إلى الموقع. اسمح بالوصول من إعدادات النظام، أو اختر المسجد يدويًا.',
            ur: 'مقام تک رسائی مسترد کر دی گئی۔ سسٹم کی ترتیبات میں اجازت دیں، یا مسجد خود منتخب کریں۔',
          })}
        </AppText>
      )}
      {gpsStatus === 'error' && (
        <AppText size="sm" tone="danger">
          {t({
            nb: 'Fant ikke posisjonen din. Velg moské manuelt.',
            en: 'Could not find your location. Choose a mosque manually.',
            ar: 'تعذّر تحديد موقعك. اختر المسجد يدويًا.',
            ur: 'آپ کا مقام نہیں مل سکا۔ مسجد خود منتخب کریں۔',
          })}
        </AppText>
      )}

      {selectedName && (
        <Pressable
          onPress={onClear}
          accessibilityRole="button"
          accessibilityLabel={t({ nb: 'Fjern valgt moské', en: 'Remove selected mosque', ar: 'إزالة المسجد المختار', ur: 'منتخب مسجد ہٹائیں' })}
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
              {t({ nb: 'Fjern valgt moské', en: 'Remove selected mosque', ar: 'إزالة المسجد المختار', ur: 'منتخب مسجد ہٹائیں' })}
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
  emptyLabel = t({ nb: 'Alle steder', en: 'All places', ar: 'كل الأماكن', ur: 'تمام مقامات' }),
}: {
  place: Place | null;
  disabled: boolean;
  onPress: () => void;
  onClear: () => void;
  emptyLabel?: string;
}) {
  const theme = useTheme();
  const active = place != null;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={
        active
          ? t({
              nb: `Filtrer på sted, ${place.name}`,
              en: `Filter by place, ${place.name}`,
              ar: `تصفية حسب المكان، ${place.name}`,
              ur: `مقام کے لحاظ سے فلٹر، ${place.name}`,
            })
          : t({
              nb: 'Filtrer på sted',
              en: 'Filter by place',
              ar: 'تصفية حسب المكان',
              ur: 'مقام کے لحاظ سے فلٹر',
            })
      }
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
        {active ? place.name : emptyLabel}
      </AppText>
      {active ? (
        <Pressable onPress={onClear} hitSlop={8} accessibilityLabel={t({
            nb: 'Fjern stedsfilter',
            en: 'Remove place filter',
            ar: 'إزالة تصفية المكان',
            ur: 'مقام کا فلٹر ہٹائیں',
          })}>
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
    {
      value: 'list',
      icon: 'list',
      label: t({ nb: 'Listevisning', en: 'List view', ar: 'عرض القائمة', ur: 'فہرست' }),
    },
    {
      value: 'map',
      icon: 'map-outline',
      label: t({ nb: 'Kartvisning', en: 'Map view', ar: 'عرض الخريطة', ur: 'نقشہ' }),
    },
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
                backgroundColor: isActive ? theme.colors.segmentActive : 'transparent',
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
