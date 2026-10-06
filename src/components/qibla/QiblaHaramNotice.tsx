import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { t } from '@/lib/i18n';
import { AppText, Card } from '@/components/ui';
import { formatDistance } from '@/lib/geo';
import { useTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';

export type QiblaHaramNoticeProps = {
  distanceKm: number;
};

export function QiblaHaramNotice({ distanceKm }: QiblaHaramNoticeProps) {
  const theme = useTheme();

  return (
    <Card rounded="xl" style={{ alignItems: 'center', gap: spacing.md }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: radius.full,
          backgroundColor: theme.colors.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Ionicons name="cube" size={30} color={theme.colors.onPrimarySoft} />
      </View>
      <AppText size="xl" weight="bold" heading align="center">
        {t('qibla.youAreAtThe')}
      </AppText>
      <AppText tone="textSecondary" align="center">
        {t('qibla.aboutAwayThisClose', { value: formatDistance(distanceKm) })}
      </AppText>
    </Card>
  );
}
