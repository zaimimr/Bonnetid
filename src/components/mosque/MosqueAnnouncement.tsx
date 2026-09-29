import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';

export function MosqueAnnouncement({
  text,
  title = 'Kunngjøring',
  numberOfLines,
}: {
  text: string;
  title?: string;
  numberOfLines?: number;
}) {
  const theme = useTheme();

  return (
    <View style={{ gap: spacing.xs }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        <Ionicons name="megaphone-outline" size={15} color={theme.colors.primary} />
        <AppText size="xs" weight="semibold" tone="primary" style={{ flex: 1 }}>
          {title}
        </AppText>
      </View>
      <AppText size="sm" tone="textSecondary" numberOfLines={numberOfLines}>
        {text}
      </AppText>
    </View>
  );
}
