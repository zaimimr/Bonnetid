import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card } from '@/components/ui';
import { useTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';
import type { HijriDay } from '@/api/types';
import { formatHijri, monthName } from '@/lib/hijri';

export type EventCardProps = {
  event: HijriDay;
  selected?: boolean;
  onPress?: () => void;
};

export function EventCard({ event, selected = false, onPress }: EventCardProps) {
  const theme = useTheme();
  const date = new Date(event.gregorian_date);

  return (
    <Card
      rounded="xl"
      onPress={onPress}
      style={
        selected
          ? {
              borderColor: theme.colors.accent,
              borderWidth: 2,
              backgroundColor: theme.colors.primarySoft,
            }
          : undefined
      }>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <View
          style={{
            minWidth: 48,
            paddingHorizontal: spacing.xs,
            borderRadius: radius.md,
            backgroundColor: selected ? theme.colors.surface : theme.colors.primarySoft,
            paddingVertical: spacing.sm,
            alignItems: 'center',
          }}>
          <AppText size="lg" weight="bold" tone="onPrimarySoft" numberOfLines={1}>
            {date.getDate()}
          </AppText>
          <AppText size="xs" tone="onPrimarySoft" numberOfLines={1}>
            {monthName(date.getMonth()).slice(0, 3)}
          </AppText>
        </View>
        <View style={{ flex: 1, gap: spacing.xxs }}>
          <AppText size="sm" weight="semibold" numberOfLines={2}>
            {event.special_date_name}
          </AppText>
          <AppText size="xs" tone="textMuted">
            {formatHijri(event.hijri_date, event.hijri_month_text)}
          </AppText>
        </View>
        <Ionicons
          name="calendar-outline"
          size={18}
          color={selected ? theme.colors.accent : theme.colors.textMuted}
        />
      </View>
    </Card>
  );
}
