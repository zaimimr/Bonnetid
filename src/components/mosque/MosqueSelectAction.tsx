import { Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Icon } from '@/components/icons';
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
        <Icon name="check-circle" size={15} color={theme.colors.primary} />
        <Badge label={t('mosque.myMosque')} variant="primary" />
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
      accessibilityLabel={t('mosque.chooseAsMyMosque', { mosqueName })}
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
      <Icon name="plus-circle" size={15} color={theme.colors.onPrimarySoft} />
      <AppText size="sm" weight="semibold" tone="onPrimarySoft" style={{ flexShrink: 1 }}>
        {t('mosque.chooseAsMyMosque2')}
      </AppText>
    </Pressable>
  );
}
