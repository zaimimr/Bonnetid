import { Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
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
        <Badge label="Min moské" variant="primary" />
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
      accessibilityLabel={`Velg ${mosqueName} som min moské`}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'flex-start',
          gap: spacing.xs,
          paddingVertical: spacing.xs,
          paddingHorizontal: spacing.md,
          borderRadius: radius.full,
          backgroundColor: theme.colors.primarySoft,
        },
        pressed && { opacity: opacity.pressed },
      ]}>
      <Ionicons name="add-circle-outline" size={15} color={theme.colors.onPrimarySoft} />
      <AppText size="sm" weight="semibold" tone="onPrimarySoft">
        Velg som min moské
      </AppText>
    </Pressable>
  );
}
