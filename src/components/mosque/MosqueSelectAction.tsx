import { Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { t } from '@/lib/i18n';
import { AppText, Badge } from '@/components/ui';
import { useTheme } from '@/theme';
import { opacity, radius, spacing } from '@/theme/tokens';

export function MosqueSelectAction({
  mosqueName,
  selected,
  onSelect,
}: {
  mosqueName: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const theme = useTheme();

  if (selected) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        <Ionicons name="checkmark-circle" size={15} color={theme.colors.primary} />
        <Badge label={t({ nb: 'Min moské', en: 'My mosque', ar: 'مسجدي', ur: 'میری مسجد' })} variant="primary" />
      </View>
    );
  }

  const select = () => {
    Haptics.selectionAsync().catch(() => {});
    onSelect();
  };

  return (
    <Pressable
      onPress={select}
      hitSlop={spacing.sm}
      accessibilityRole="button"
      accessibilityLabel={t({
        nb: `Velg ${mosqueName} som min moské`,
        en: `Choose ${mosqueName} as my mosque`,
        ar: `اختيار ${mosqueName} مسجدًا لي`,
        ur: `${mosqueName} کو اپنی مسجد منتخب کریں`,
      })}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'flex-start',
          maxWidth: '100%',
          gap: spacing.xs,
          paddingVertical: spacing.xs,
          paddingHorizontal: spacing.md,
          borderRadius: radius.full,
          backgroundColor: theme.colors.primarySoft,
        },
        pressed && { opacity: opacity.pressed },
      ]}>
      <Ionicons name="add-circle-outline" size={15} color={theme.colors.onPrimarySoft} />
      <AppText size="sm" weight="semibold" tone="onPrimarySoft" style={{ flexShrink: 1 }}>
        {t({
          nb: 'Velg som min moské',
          en: 'Choose as my mosque',
          ar: 'اختيار كمسجدي',
          ur: 'اپنی مسجد منتخب کریں',
        })}
      </AppText>
    </Pressable>
  );
}
