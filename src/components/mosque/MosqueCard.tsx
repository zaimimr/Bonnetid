import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Badge, Card } from '@/components/ui';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';
import type { Mosque } from '@/api/types';
import { formatDistance } from '@/lib/geo';
import { mosqueCardSubtitle } from '@/lib/mosqueAddress';
import { eidBadgeLabel, type EidPeriod } from '@/lib/hijri';
import { JUMMAH_MISSING_SHORT } from '@/lib/jummahCopy';

export type MosqueCardProps = {
  mosque: Mosque;
  distanceKm?: number;
  eidPeriod?: EidPeriod | null;
  showMissingJummah?: boolean;
  place?: string;
  selected?: boolean;
  accessory?: 'chevron' | 'check' | 'none';
  onPress: () => void;
};

export function MosqueCard({
  mosque,
  distanceKm,
  eidPeriod,
  showMissingJummah = false,
  place,
  selected,
  accessory = 'chevron',
  onPress,
}: MosqueCardProps) {
  const theme = useTheme();
  const jummahLabel = mosque.jummah
    .slice(0, 2)
    .map((entry) => entry.jummah)
    .join(' · ');
  const eidTimes = eidPeriod && mosque.show_eid ? mosque.eid_prayers : [];
  const missingJummah = showMissingJummah && !jummahLabel;
  const subtitle = mosqueCardSubtitle(mosque.address, place);

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
            {eidPeriod && eidTimes.length > 0 && (
              <Badge label={`${eidBadgeLabel(eidPeriod)} ${eidTimes.join(' · ')}`} variant="primary" />
            )}
            {jummahLabel ? <Badge label={`Jumuah ${jummahLabel}`} variant="primary" /> : null}
          </View>
          {missingJummah ? (
            <AppText size="xs" tone="textMuted" style={{ marginTop: spacing.xxs }}>
              {JUMMAH_MISSING_SHORT}
            </AppText>
          ) : null}
        </View>

        {accessory === 'chevron' && (
          <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
        )}
        {accessory === 'check' && (
          <Ionicons name="checkmark-circle" size={22} color={theme.colors.primary} />
        )}
      </View>
    </Card>
  );
}
