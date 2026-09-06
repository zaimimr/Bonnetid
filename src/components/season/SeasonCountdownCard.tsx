import { View } from 'react-native';
import { AppText, Card } from '@/components/ui';
import { spacing } from '@/theme/tokens';

export type SeasonCountdownCardProps = {
  text: string;
  hijriYear: number | null;
  note?: string;
};

export function SeasonCountdownCard({ text, hijriYear, note }: SeasonCountdownCardProps) {
  return (
    <Card rounded="xl" padding="md">
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          columnGap: spacing.md,
          rowGap: spacing.xxs,
        }}>
        <AppText size="sm" weight="medium" tone="textSecondary">
          {text}
        </AppText>
        {hijriYear != null && (
          <AppText size="sm" tone="textMuted" tabular>
            {hijriYear}
          </AppText>
        )}
      </View>
      {note && (
        <AppText size="xs" tone="textMuted" style={{ marginTop: spacing.sm }}>
          {note}
        </AppText>
      )}
    </Card>
  );
}
