import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card } from '@/components/ui';
import type { ExtraTime, ExtraTimeName } from '@/lib/extraTimes';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';

const ICONS: Record<ExtraTimeName, keyof typeof Ionicons.glyphMap> = {
  duha: 'sunny-outline',
  zawal: 'contrast-outline',
  midnight: 'moon-outline',
  tahajjud: 'star-outline',
};

export function ExtraTimesCard({ times }: { times: ExtraTime[] }) {
  const theme = useTheme();

  return (
    <Card padding="sm" rounded="xl">
      {times.map((entry, index) => (
        <View
          key={entry.name}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.md,
            borderBottomWidth: index === times.length - 1 ? 0 : 1,
            borderBottomColor: theme.colors.border,
          }}>
          <Ionicons name={ICONS[entry.name]} size={20} color={theme.colors.textMuted} />
          <View style={{ flex: 1, gap: spacing.xxs }}>
            <AppText weight="medium">{entry.label}</AppText>
            <AppText size="xs" tone="textMuted">
              {entry.note}
            </AppText>
          </View>
          <AppText weight="medium" tabular>
            {entry.time}
          </AppText>
        </View>
      ))}
    </Card>
  );
}
