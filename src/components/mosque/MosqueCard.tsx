import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Badge, Card } from '@/components/ui';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';
import type { Mosque } from '@/api/types';
import { formatDistance } from '@/lib/geo';
import { JUMMAH_MISSING_SHORT } from '@/lib/jummahCopy';

export type MosqueCardProps = {
  mosque: Mosque;
  distanceKm?: number;
  showEid?: boolean;
  showMissingJummah?: boolean;
  place?: string;
  selected?: boolean;
  onPress: () => void;
};

export function MosqueCard({
  mosque,
  distanceKm,
  showEid,
  showMissingJummah = false,
  place,
  selected,
  onPress,
}: MosqueCardProps) {
  const theme = useTheme();
  const jummahLabel = mosque.jummah
    .slice(0, 2)
    .map((entry) => entry.jummah)
    .join(' · ');
  const eidTimes = showEid && mosque.show_eid ? mosque.eid_prayers : [];
  const missingJummah = showMissingJummah && !jummahLabel;
  const subtitle = [mosque.address, place].filter(Boolean).join(' · ');

  return (
    <Card onPress={onPress} rounded="xl">
      <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
        <View style={{ flex: 1, gap: spacing.xxs }}>
          <AppText weight="semibold" numberOfLines={2}>
            {mosque.name}
          </AppText>
          {subtitle ? (
            <AppText size="sm" tone="textMuted" numberOfLines={2}>
              {subtitle}
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
          {missingJummah ? (
            <AppText size="xs" tone="textMuted" style={{ marginTop: spacing.xxs }}>
              {JUMMAH_MISSING_SHORT}
            </AppText>
          ) : null}
        </View>

        <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
      </View>
    </Card>
  );
}
