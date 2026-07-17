import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Badge, Card } from '@/components/ui';
import { useTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';
import type { Mosque } from '@/api/types';
import { formatDistance } from '@/lib/geo';

export type MosqueCardProps = {
  mosque: Mosque;
  distanceKm?: number;
  onPress: () => void;
};

export function MosqueCard({ mosque, distanceKm, onPress }: MosqueCardProps) {
  const theme = useTheme();
  const nextJummah = mosque.jummah[0]?.jummah;

  return (
    <Card onPress={onPress} rounded="xl">
      <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: radius.md,
            backgroundColor: theme.colors.primarySoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Ionicons name="business" size={22} color={theme.colors.primary} />
        </View>

        <View style={{ flex: 1, gap: spacing.xxs }}>
          <AppText weight="semibold" numberOfLines={1}>
            {mosque.name}
          </AppText>
          {mosque.address ? (
            <AppText size="sm" tone="textMuted" numberOfLines={1}>
              {mosque.address}
            </AppText>
          ) : null}
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xxs }}>
            {distanceKm != null && <Badge label={formatDistance(distanceKm)} variant="neutral" />}
            {nextJummah && <Badge label={`Jummah ${nextJummah}`} variant="primary" />}
          </View>
        </View>

        <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
      </View>
    </Card>
  );
}
