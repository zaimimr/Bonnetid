import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { t } from '@/lib/i18n';
import { AppText, mirrored } from '@/components/ui';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';

export function MosqueAnnouncement({
  text,
  title = t({ nb: 'Kunngjøring', en: 'Announcement', ar: 'إعلان', ur: 'اعلان' }),
  compact = false,
  chevron = false,
}: {
  text: string;
  title?: string;
  compact?: boolean;
  chevron?: boolean;
}) {
  const theme = useTheme();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
      <View style={{ flex: 1, gap: spacing.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <Ionicons name="megaphone-outline" size={15} color={theme.colors.primary} />
          <AppText size="xs" weight="semibold" tone="primary" style={{ flex: 1 }} numberOfLines={1}>
            {title}
          </AppText>
        </View>
        <AppText size="sm" tone="textSecondary" numberOfLines={compact ? 1 : undefined}>
          {text}
        </AppText>
      </View>
      {chevron && <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} style={mirrored} />}
    </View>
  );
}
