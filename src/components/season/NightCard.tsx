import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { t } from '@/lib/i18n';
import { DuaLink } from '@/components/duas/DuaLink';
import { AppText, Card } from '@/components/ui';
import { useCurrentNight } from '@/hooks/useHijriSeason';
import { useFontScale } from '@/hooks/useFontScale';
import { nightHeadline } from '@/lib/hijriNights';
import { MOON_SIGHTING_NOTE } from '@/lib/hijriSeason';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';

export type NightCardProps = {
  now: Date;
  onPress?: (isoDate: string) => void;
};

export function NightCard({ now, onPress }: NightCardProps) {
  const theme = useTheme();
  const { isStacked } = useFontScale();
  const night = useCurrentNight(now);

  if (!night) return null;

  return (
    <Card rounded="xl" padding="lg" onPress={onPress ? () => onPress(night.isoDate) : undefined}>
      <View
        style={{
          flexDirection: isStacked ? 'column' : 'row',
          alignItems: isStacked ? 'flex-start' : 'center',
          gap: spacing.md,
        }}>
        <Ionicons name="moon-outline" size={22} color={theme.colors.seasonHighlight} />
        <View style={{ flex: isStacked ? undefined : 1, gap: spacing.xxs }}>
          <AppText weight="semibold">{nightHeadline(night)}</AppText>
          <AppText size="sm" tone="textSecondary">
            {night.note}
          </AppText>
        </View>
      </View>
      <AppText size="xs" tone="textMuted" style={{ marginTop: spacing.sm }}>
        {MOON_SIGHTING_NOTE}
      </AppText>
      {night.duaId && <DuaLink duaId={night.duaId} label={t({
            nb: `Dua for ${night.title}`,
            en: `Dua for ${night.title}`,
            ar: `دعاء ${night.title}`,
            ur: `${night.title} کی دعا`,
          })} />}
    </Card>
  );
}
