import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/icons';
import { AppText, Card } from '@/components/ui';
import { FEATURES, useAvailableFeatures } from '@/components/customization/features';
import { track } from '@/lib/telemetry';
import { useSettings } from '@/store/settings';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';

export function HomeShortcuts() {
  const router = useRouter();
  const theme = useTheme();
  const shortcuts = useSettings((state) => state.shortcuts);
  const available = useAvailableFeatures();
  const visible = shortcuts.filter((id) => available.includes(id));

  if (visible.length === 0) return null;

  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
      {visible.map((id) => {
        const feature = FEATURES[id];
        return (
          <Card
            key={id}
            padding="sm"
            rounded="xl"
            onPress={() => {
              track('home_shortcut_opened', { feature: id });
              router.push(feature.href);
            }}
            style={{ flex: 1, alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.md }}>
            <Icon name={feature.icon} size={24} color={theme.colors.primary} />
            <AppText size="xs" weight="medium" align="center" numberOfLines={1}>
              {feature.label}
            </AppText>
          </Card>
        );
      })}
    </View>
  );
}
