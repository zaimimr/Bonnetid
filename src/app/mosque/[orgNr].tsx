import { Linking, Platform, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMosque } from '@/api/queries';
import type { Mosque } from '@/api/types';
import { AppText, Button, Card, ErrorState, ListRow, Screen, SectionHeader, Skeleton } from '@/components/ui';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';
import { PRAYER_LABELS } from '@/lib/prayerSchedule';

export default function MosqueDetailScreen() {
  const { orgNr } = useLocalSearchParams<{ orgNr: string }>();
  const { data: mosque, isLoading, isError, refetch } = useMosque(orgNr);

  return (
    <Screen scroll edges={[]}>
      <Stack.Screen options={{ title: mosque?.name ?? '' }} />

      {isLoading && (
        <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
          <Skeleton height={120} rounded="xl" />
          <Skeleton height={220} rounded="xl" />
        </View>
      )}

      {isError && <ErrorState onRetry={refetch} />}

      {mosque && <MosqueDetail mosque={mosque} />}
    </Screen>
  );
}

function MosqueDetail({ mosque }: { mosque: Mosque }) {
  const theme = useTheme();
  const jamat = mosque.jamat;

  const jamatSource: [keyof typeof PRAYER_LABELS, string | null][] = jamat
    ? [
        ['fajr', jamat.fajr],
        ['duhr', jamat.duhr],
        ['asr', jamat.asr],
        ['maghrib', jamat.maghrib],
        ['isha', jamat.isha],
      ]
    : [];
  const jamatRows = jamatSource.filter(
    (row): row is [keyof typeof PRAYER_LABELS, string] => row[1] != null,
  );

  const openDirections = () => {
    if (!mosque.lat || !mosque.lon) return;
    const label = encodeURIComponent(mosque.name);
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${mosque.lat},${mosque.lon}`,
      default: `geo:0,0?q=${mosque.lat},${mosque.lon}(${label})`,
    });
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={{ marginTop: spacing.lg, gap: spacing.lg }}>
      <Card rounded="xl">
        <View style={{ gap: spacing.sm }}>
          <AppText size="xl" weight="bold" heading>
            {mosque.name}
          </AppText>
          {mosque.address ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Ionicons name="location-outline" size={16} color={theme.colors.textMuted} />
              <AppText size="sm" tone="textSecondary">
                {mosque.address}
                {mosque.post ? `, ${mosque.post.code} ${mosque.post.city}` : ''}
              </AppText>
            </View>
          ) : null}
          {mosque.info ? (
            <AppText size="sm" tone="textMuted">
              {mosque.info}
            </AppText>
          ) : null}
          {mosque.lat && mosque.lon && (
            <Button
              label="Veibeskrivelse"
              variant="secondary"
              size="sm"
              onPress={openDirections}
              style={{ marginTop: spacing.sm }}
            />
          )}
        </View>
      </Card>

      {jamatRows.length > 0 && (
        <View>
          <SectionHeader
            title="Jamat-tider"
            subtitle={
              jamat?.start_date && jamat.end_date
                ? `Gjelder ${jamat.start_date} til ${jamat.end_date}`
                : undefined
            }
          />
          <Card padding="sm" rounded="xl">
            {jamatRows.map(([name, time], index) => (
              <ListRow
                key={name}
                title={PRAYER_LABELS[name]}
                trailing={
                  <AppText weight="semibold" tabular>
                    {time}
                  </AppText>
                }
                style={{
                  paddingHorizontal: spacing.md,
                  borderBottomWidth: index === jamatRows.length - 1 ? 0 : 1,
                  borderBottomColor: theme.colors.border,
                }}
              />
            ))}
          </Card>
        </View>
      )}

      {mosque.jummah.length > 0 && (
        <View>
          <SectionHeader title="Jummah" />
          <Card padding="sm" rounded="xl">
            {mosque.jummah.map((entry, index) => (
              <ListRow
                key={entry.id}
                title={mosque.jummah.length > 1 ? `Jummah ${index + 1}` : 'Fredagsbønn'}
                trailing={
                  <AppText weight="semibold" tabular>
                    {entry.jummah}
                  </AppText>
                }
                style={{
                  paddingHorizontal: spacing.md,
                  borderBottomWidth: index === mosque.jummah.length - 1 ? 0 : 1,
                  borderBottomColor: theme.colors.border,
                }}
              />
            ))}
          </Card>
        </View>
      )}

      {(mosque.contact_phone || mosque.contact_email) && (
        <View>
          <SectionHeader title="Kontakt" />
          <Card padding="sm" rounded="xl">
            {mosque.contact_phone && (
              <ListRow
                title={mosque.contact_phone}
                leading={<Ionicons name="call-outline" size={20} color={theme.colors.primary} />}
                onPress={() => Linking.openURL(`tel:${mosque.contact_phone}`).catch(() => {})}
                style={{ paddingHorizontal: spacing.md }}
              />
            )}
            {mosque.contact_email && (
              <ListRow
                title={mosque.contact_email}
                leading={<Ionicons name="mail-outline" size={20} color={theme.colors.primary} />}
                onPress={() => Linking.openURL(`mailto:${mosque.contact_email}`).catch(() => {})}
                style={{ paddingHorizontal: spacing.md }}
              />
            )}
          </Card>
        </View>
      )}
    </View>
  );
}
