import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Badge, Card } from '@/components/ui';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';
import type { Mosque } from '@/api/types';
import { formatDistance } from '@/lib/geo';

export type MosqueCardProps = {
  mosque: Mosque;
  distanceKm?: number;
  showEid?: boolean;
  selected?: boolean;
  onPress: () => void;
};

export function MosqueCard({ mosque, distanceKm, showEid, selected, onPress }: MosqueCardProps) {
  const theme = useTheme();
  const jummahLabel = mosque.jummah
    .slice(0, 2)
    .map((entry) => entry.jummah)
    .join(' · ');
  const eidTimes = showEid && mosque.show_eid ? mosque.eid_prayers : [];

  return (
    <Card onPress={onPress} rounded="xl">
      <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
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
            {selected && <Badge label="Min moské" variant="primary" />}
            {distanceKm != null && <Badge label={formatDistance(distanceKm)} variant="neutral" />}
            {eidTimes.length > 0 && <Badge label={`Eid ${eidTimes.join(' · ')}`} variant="primary" />}
            {jummahLabel ? <Badge label={`Jumuah ${jummahLabel}`} variant="primary" /> : null}
          </View>
        </View>

        <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
      </View>
    </Card>
  );
}
