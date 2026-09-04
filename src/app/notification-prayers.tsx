import { Switch, View } from 'react-native';
import { Card, Divider, ListRow, Screen } from '@/components/ui';
import { PRAYER_LABELS } from '@/lib/prayerSchedule';
import { track } from '@/lib/telemetry';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';
import { NOTIFIABLE_PRAYERS, useSettings } from '@/store/settings';

export default function NotificationPrayersScreen() {
  const theme = useTheme();
  const notificationPrayers = useSettings((state) => state.notificationPrayers);
  const toggleNotificationPrayer = useSettings((state) => state.toggleNotificationPrayer);

  return (
    <Screen scroll edges={[]}>
      <Card padding="sm" rounded="xl" style={{ marginTop: spacing.lg }}>
        {NOTIFIABLE_PRAYERS.map((prayer, index) => (
          <View key={prayer}>
            {index > 0 && <Divider />}
            <ListRow
              title={PRAYER_LABELS[prayer]}
              trailing={
                <Switch
                  value={notificationPrayers[prayer]}
                  onValueChange={() => {
                    toggleNotificationPrayer(prayer);
                    track('notification_prayer_toggled', {
                      prayer,
                      enabled: !notificationPrayers[prayer],
                    });
                  }}
                  trackColor={{ true: theme.colors.primary, false: theme.colors.borderStrong }}
                  thumbColor={theme.colors.surface}
                />
              }
              style={{ paddingHorizontal: spacing.md }}
            />
          </View>
        ))}
      </Card>

    </Screen>
  );
}
