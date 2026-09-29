import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, Divider, ListRow, Screen, SectionHeader, Toggle } from '@/components/ui';
import { getNotificationSound } from '@/lib/notificationSounds';
import { PRAYER_LABELS } from '@/lib/prayerSchedule';
import { track } from '@/lib/telemetry';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';
import { NOTIFIABLE_PRAYERS, useSettings } from '@/store/settings';

export default function NotificationPrayersScreen() {
  const theme = useTheme();
  const router = useRouter();
  const notificationPrayers = useSettings((state) => state.notificationPrayers);
  const toggleNotificationPrayer = useSettings((state) => state.toggleNotificationPrayer);
  const notificationSound = useSettings((state) => state.notificationSound);

  return (
    <Screen scroll edges={[]}>
      <SectionHeader title="Varsle for" style={{ marginTop: spacing.lg }} />
      <Card padding="sm" rounded="xl">
        {NOTIFIABLE_PRAYERS.map((prayer, index) => (
          <View key={prayer}>
            {index > 0 && <Divider />}
            <ListRow
              title={PRAYER_LABELS[prayer]}
              trailing={
                <Toggle
                  value={notificationPrayers[prayer]}
                  onValueChange={() => {
                    toggleNotificationPrayer(prayer);
                    track('notification_prayer_toggled', {
                      prayer,
                      enabled: !notificationPrayers[prayer],
                    });
                  }}
                />
              }
              style={{ paddingHorizontal: spacing.md }}
            />
          </View>
        ))}
      </Card>

      <SectionHeader title="Lyd" style={{ marginTop: spacing.lg }} />
      <Card padding="sm" rounded="xl">
        <ListRow
          title="Varsellyd"
          subtitle={getNotificationSound(notificationSound).label}
          leading={<Ionicons name="musical-notes-outline" size={20} color={theme.colors.primary} />}
          chevron
          onPress={() => router.push('/notification-sound')}
          style={{ paddingHorizontal: spacing.md }}
        />
      </Card>
    </Screen>
  );
}
