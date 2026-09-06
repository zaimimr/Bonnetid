import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card } from '@/components/ui';
import { useFontScale } from '@/hooks/useFontScale';
import { formatDistance } from '@/lib/geo';
import type { JummahReach, RankedJummah } from '@/lib/jummahFinder';
import { useTheme } from '@/theme';
import type { Theme } from '@/theme/theme';
import { radius, spacing } from '@/theme/tokens';

export const REACH_LABELS: Record<JummahReach, string> = {
  reachable: 'Du rekker det',
  tight: 'Det blir tett',
  started: 'Har startet',
  late: 'Du rekker ikke starten',
  finished: 'Ferdig i dag',
  far: 'For langt unna',
  unknown: 'Fredagstid',
};

function reachColors(reach: JummahReach, theme: Theme): { background: string; text: string } {
  if (reach === 'reachable') {
    return { background: theme.colors.primarySoft, text: theme.colors.onPrimarySoft };
  }
  if (reach === 'tight') {
    return { background: theme.colors.accent, text: theme.colors.onAccent };
  }
  if (reach === 'started' || reach === 'late') {
    return { background: theme.colors.surfaceSunken, text: theme.colors.textSecondary };
  }
  return { background: theme.colors.surfaceSunken, text: theme.colors.textMuted };
}

export function ReachPill({ reach }: { reach: JummahReach }) {
  const theme = useTheme();
  const colors = reachColors(reach, theme);

  return (
    <View
      style={{
        backgroundColor: colors.background,
        borderRadius: radius.full,
        paddingVertical: spacing.xxs,
        paddingHorizontal: spacing.sm,
        alignSelf: 'flex-start',
      }}>
      <AppText size="xs" weight="semibold" color={colors.text}>
        {REACH_LABELS[reach]}
      </AppText>
    </View>
  );
}

function timingLine(item: RankedJummah): string | null {
  const parts: string[] = [];

  if (item.reach === 'started' && item.minutesUntilStart != null) {
    parts.push(`startet for ${Math.abs(item.minutesUntilStart)} min siden`);
  } else if (item.minutesUntilStart != null && item.minutesUntilStart >= 0) {
    parts.push(item.minutesUntilStart === 0 ? 'starter nå' : `om ${item.minutesUntilStart} min`);
  }

  if (item.distanceKm != null) parts.push(formatDistance(item.distanceKm));
  if (item.travelMinutes != null) parts.push(`ca. ${item.travelMinutes} min reise`);

  return parts.length > 0 ? parts.join(' · ') : null;
}

export type JummahMosqueCardProps = {
  item: RankedJummah;
  onPress: () => void;
};

export function JummahMosqueCard({ item, onPress }: JummahMosqueCardProps) {
  const theme = useTheme();
  const { isStacked } = useFontScale();
  const place = item.address ?? item.city;
  const timing = timingLine(item);
  const dimmed = item.reach === 'finished' || item.reach === 'far' || item.reach === 'late';

  const time = (
    <AppText size="xl" weight="bold" tabular tone={dimmed ? 'textMuted' : 'textPrimary'}>
      {item.slot?.time ?? '–'}
    </AppText>
  );

  return (
    <Card onPress={onPress} rounded="xl">
      <View
        style={{
          flexDirection: isStacked ? 'column' : 'row',
          alignItems: isStacked ? 'flex-start' : 'center',
          gap: spacing.md,
        }}>
        <View style={{ flex: isStacked ? undefined : 1, gap: spacing.xxs }}>
          <AppText weight="semibold" numberOfLines={2}>
            {item.name}
          </AppText>
          {place ? (
            <AppText size="sm" tone="textMuted" numberOfLines={1}>
              {place}
            </AppText>
          ) : null}
        </View>

        {isStacked ? time : <View style={{ alignItems: 'flex-end' }}>{time}</View>}

        {!isStacked && (
          <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
        )}
      </View>

      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          columnGap: spacing.sm,
          rowGap: spacing.xs,
          marginTop: spacing.md,
        }}>
        <ReachPill reach={item.reach} />
        {timing ? (
          <AppText size="sm" tone="textMuted" style={{ flexShrink: 1 }}>
            {timing}
          </AppText>
        ) : null}
      </View>

      {item.laterSlots.length > 0 && (
        <AppText size="sm" tone="textMuted" style={{ marginTop: spacing.xs }}>
          {`Også ${item.laterSlots.map((slot) => slot.time).join(' · ')}`}
        </AppText>
      )}
    </Card>
  );
}
