import { View } from 'react-native';
import { AppText, Badge, Card } from '@/components/ui';
import { DuaLink } from '@/components/duas/DuaLink';
import { SeasonCountdownCard } from '@/components/season/SeasonCountdownCard';
import {
  ARAFAH_DAY,
  DHUL_HIJJAH_SEASON,
  EID_AL_ADHA_DAY,
  MOON_SIGHTING_NOTE,
  dhulHijjahCountdownText,
  dhulHijjahDayTitle,
  dhulHijjahHighlight,
  type SeasonStatus,
} from '@/lib/hijriSeason';
import { DUA_LINKS } from '@/lib/duas';
import { useTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';

const TRACK_HEIGHT = 6;

export type DhulHijjahCardProps = {
  status: SeasonStatus;
};

function badgeLabel(day: number | null): string | null {
  if (day === ARAFAH_DAY) return 'Arafah';
  if (day === EID_AL_ADHA_DAY) return 'Eid al-Adha';
  return null;
}

export function DhulHijjahCard({ status }: DhulHijjahCardProps) {
  const theme = useTheme();

  if (!status.isActive) {
    return (
      <SeasonCountdownCard
        text={dhulHijjahCountdownText(status.daysUntilStart ?? 0)}
        hijriYear={status.hijriYear}
        note={MOON_SIGHTING_NOTE}
      />
    );
  }

  const day = status.dayOfSeason;
  const badge = badgeLabel(day);
  const highlight = dhulHijjahHighlight(day);
  const segments = Array.from({ length: DHUL_HIJJAH_SEASON.lastDay }, (_, index) => index + 1);

  return (
    <Card rounded="xl" padding="lg">
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          columnGap: spacing.md,
          rowGap: spacing.xxs,
        }}>
        <AppText weight="semibold">{dhulHijjahDayTitle(day)}</AppText>
        {status.hijriYear != null && (
          <AppText size="sm" tone="textMuted" tabular>
            {status.hijriYear}
          </AppText>
        )}
      </View>

      {badge && <Badge label={badge} variant="accent" style={{ marginTop: spacing.sm }} />}

      <View
        accessibilityRole="progressbar"
        accessibilityLabel="De ti første dagene i Dhul Hijjah"
        accessibilityValue={{ min: 1, max: DHUL_HIJJAH_SEASON.lastDay, now: day ?? 1 }}
        style={{
          marginTop: spacing.md,
          flexDirection: 'row',
          gap: spacing.xxs,
        }}>
        {segments.map((segment) => (
          <View
            key={segment}
            style={{
              flex: 1,
              height: TRACK_HEIGHT,
              borderRadius: radius.full,
              backgroundColor:
                day != null && segment <= day
                  ? theme.colors.seasonHighlight
                  : theme.colors.surfaceSunken,
            }}
          />
        ))}
      </View>

      {highlight && (
        <AppText size="sm" tone="textSecondary" style={{ marginTop: spacing.md }}>
          {highlight}
        </AppText>
      )}

      <AppText size="xs" tone="textMuted" style={{ marginTop: spacing.sm }}>
        {MOON_SIGHTING_NOTE}
      </AppText>

      <DuaLink category={DUA_LINKS.hajj} label="Duaer for Hajj og Dhul-Hijjah" />
    </Card>
  );
}
