import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Badge, Card } from '@/components/ui';
import { MosqueLogo } from '@/components/mosque/MosqueLogo';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';
import type { Mosque } from '@/api/types';
import { formatDistance } from '@/lib/geo';

export type MosqueCardProps = {
  mosque: Mosque;
  distanceKm?: number;
  showEid?: boolean;
  onPress: () => void;
};

export function MosqueCard({ mosque, distanceKm, showEid, onPress }: MosqueCardProps) {
  const theme = useTheme();
  const nextJummah = mosque.jummah[0]?.jummah;
  const eidTimes = showEid && mosque.show_eid ? mosque.eid_prayers : [];

  return (
    <Card onPress={onPress} rounded="xl">
      <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
        <MosqueLogo uri={mosque.logo} size="md" />

        <View style={{ flex: 1, gap: spacing.xxs }}>
          <AppText weight="semibold" numberOfLines={2}>
            {mosque.name}
          </AppText>
          {mosque.address ? (
            <AppText size="sm" tone="textMuted" numberOfLines={1}>
              {mosque.address}
            </AppText>
          ) : null}
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              columnGap: spacing.sm,
              rowGap: spacing.xs,
              marginTop: spacing.xxs,
            }}>
            {distanceKm != null && <Badge label={formatDistance(distanceKm)} variant="neutral" />}
            {eidTimes.length > 0 && <Badge label={`Eid ${eidTimes.join(' · ')}`} variant="primary" />}
            {nextJummah && <Badge label={`Jummah ${nextJummah}`} variant="primary" />}
          </View>
        </View>

        <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
      </View>
    </Card>
  );
}
