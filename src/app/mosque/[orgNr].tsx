import { useMemo } from 'react';
import { ActionSheetIOS, Linking, Platform, Pressable, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMosque, usePrayerTimes } from '@/api/queries';
import { toPreference, useEffectiveAsrMethod } from '@/hooks/useEffectiveAsrMethod';
import { useIsEidPeriod } from '@/hooks/useIsEidPeriod';
import { useRefresh } from '@/hooks/useRefresh';
import { useFontScale, scaleWidth } from '@/hooks/useFontScale';
import type { Mosque } from '@/api/types';
import { AppText, Card, ErrorState, ListRow, Screen, SectionHeader, Skeleton } from '@/components/ui';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';
import {
  adhanTimesFromSchedule,
  buildDaySchedule,
  jamatTimesForDate,
  PRAYER_LABELS,
} from '@/lib/prayerSchedule';
import { isoDateKey, todayKey } from '@/lib/time';
import { TimeCell, TimeCellRow, TIME_COLUMN_WIDTH } from '@/components/prayer/TimeCell';

const ASR_METHOD_LABELS: Record<Mosque['asr_method'], string | null> = {
  IRN: 'Asr beregnes med IRN standard',
  SHADOW_1X: 'Asr beregnes med 1x skygge',
  SHADOW_2X: 'Asr beregnes med 2x skygge (Hanafi)',
  WUSTA: 'Asr beregnes med Wusta',
  NONE: null,
};

export default function MosqueDetailScreen() {
  const { orgNr } = useLocalSearchParams<{ orgNr: string }>();
  const { data: mosque, isLoading, isError, refetch } = useMosque(orgNr);
  const { refreshing, onRefresh } = useRefresh();

  return (
    <Screen scroll edges={[]} refreshing={refreshing} onRefresh={onRefresh}>
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

const JAMAT_PRAYERS = ['fajr', 'duhr', 'asr', 'maghrib', 'isha'] as const;

function MosqueDetail({ mosque }: { mosque: Mosque }) {
  const theme = useTheme();
  const { scale, isStacked } = useFontScale();
  const columnWidth = scaleWidth(TIME_COLUMN_WIDTH, scale);
  const jamat = mosque.jamat;
  const isEidPeriod = useIsEidPeriod();
  const eidTimes = isEidPeriod && mosque.show_eid ? mosque.eid_prayers : [];

  const today = useMemo(() => new Date(), []);
  const month = usePrayerTimes(
    mosque.location_iso ?? '',
    today.getFullYear(),
    today.getMonth() + 1,
    { enabled: mosque.location_iso != null },
  );
  const day = month.data?.find((row) => row.date === todayKey(today));
  const fallbackAsr = useEffectiveAsrMethod();
  const asrPreference = toPreference(mosque.asr_method) ?? fallbackAsr;
  const adhanTimes = useMemo(
    () => adhanTimesFromSchedule(day ? buildDaySchedule(day, today, asrPreference) : []),
    [day, today, asrPreference],
  );
  const jamatTimes = jamatTimesForDate(jamat, isoDateKey(today), adhanTimes, mosque.jummah);

  const jamatRows = JAMAT_PRAYERS.map((name) => ({
    name,
    adhan: adhanTimes[name] ?? null,
    jamat: jamatTimes[name] ?? null,
  })).filter((row) => row.adhan != null || row.jamat != null);

  const openDirections = async () => {
    if (!mosque.lat || !mosque.lon) return;
    const label = encodeURIComponent(mosque.name);
    const coords = `${mosque.lat},${mosque.lon}`;
    if (Platform.OS !== 'ios') {
      Linking.openURL(`geo:0,0?q=${coords}(${label})`).catch(() => {});
      return;
    }
    const candidates = [
      { name: 'Apple Maps', url: `maps:?daddr=${coords}&q=${label}` },
      { name: 'Google Maps', url: `comgooglemaps://?daddr=${coords}` },
      { name: 'Waze', url: `waze://?ll=${coords}&navigate=yes` },
    ];
    const installed = [candidates[0]];
    for (const candidate of candidates.slice(1)) {
      if (await Linking.canOpenURL(candidate.url).catch(() => false)) {
        installed.push(candidate);
      }
    }
    if (installed.length === 1) {
      Linking.openURL(installed[0].url).catch(() => {});
      return;
    }
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: mosque.name,
        options: [...installed.map((app) => app.name), 'Avbryt'],
        cancelButtonIndex: installed.length,
      },
      (index) => {
        if (index < installed.length) {
          Linking.openURL(installed[index].url).catch(() => {});
        }
      },
    );
  };

  return (
    <View style={{ marginTop: spacing.lg, gap: spacing.lg }}>
      <Card rounded="xl">
        <View style={{ gap: spacing.sm }}>
          <AppText size="xl" weight="bold" heading>
            {mosque.name}
          </AppText>
          {mosque.address ? (
            <Pressable
              onPress={openDirections}
              disabled={!mosque.lat || !mosque.lon}
              hitSlop={spacing.xs}
              style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Ionicons name="location-outline" size={16} color={theme.colors.primary} />
              <AppText size="sm" tone={mosque.lat && mosque.lon ? 'primary' : 'textSecondary'}>
                {mosque.address}
                {mosque.post ? `, ${mosque.post.code} ${mosque.post.city}` : ''}
              </AppText>
            </Pressable>
          ) : null}
          {mosque.info ? (
            <AppText size="sm" tone="textMuted">
              {mosque.info}
            </AppText>
          ) : null}
          {ASR_METHOD_LABELS[mosque.asr_method] && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Ionicons name="time-outline" size={16} color={theme.colors.textMuted} />
              <AppText size="sm" tone="textSecondary">
                {ASR_METHOD_LABELS[mosque.asr_method]}
              </AppText>
            </View>
          )}
        </View>
      </Card>

      {jamatRows.length > 0 && (
        <View>
          <SectionHeader
            title="Bønnetider i dag"
            subtitle={
              jamat?.start_date && jamat.end_date
                ? `Jamat gjelder ${jamat.start_date} til ${jamat.end_date}`
                : undefined
            }
          />
          <Card padding="sm" rounded="xl">
            {!isStacked && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: spacing.md,
                  paddingTop: spacing.sm,
                  paddingBottom: spacing.xs,
                  gap: spacing.md,
                }}>
                <View style={{ flex: 1 }} />
                <AppText
                  size="xs"
                  weight="medium"
                  tone="textMuted"
                  align="right"
                  style={{ width: columnWidth }}>
                  Adhan
                </AppText>
                <AppText
                  size="xs"
                  weight="medium"
                  tone="textMuted"
                  align="right"
                  style={{ width: columnWidth }}>
                  Jamat
                </AppText>
              </View>
            )}
            {jamatRows.map((row, index) => {
              const times = (
                <>
                  <TimeCell
                    value={row.adhan ?? '–'}
                    label="Adhan"
                    stacked={isStacked}
                    width={columnWidth}
                  />
                  <TimeCell
                    value={row.jamat ?? '–'}
                    label="Jamat"
                    stacked={isStacked}
                    width={columnWidth}
                    weight="semibold"
                    tone={row.jamat ? 'primary' : 'textMuted'}
                  />
                </>
              );
              return (
                <View
                  key={row.name}
                  style={{
                    flexDirection: isStacked ? 'column' : 'row',
                    alignItems: isStacked ? 'stretch' : 'center',
                    gap: isStacked ? spacing.xs : spacing.md,
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.md,
                    borderBottomWidth: index === jamatRows.length - 1 ? 0 : 1,
                    borderBottomColor: theme.colors.border,
                  }}>
                  <AppText weight="medium" style={isStacked ? undefined : { flex: 1 }}>
                    {PRAYER_LABELS[row.name]}
                  </AppText>
                  {isStacked ? <TimeCellRow>{times}</TimeCellRow> : times}
                </View>
              );
            })}
          </Card>
        </View>
      )}

      {eidTimes.length > 0 && (
        <View>
          <SectionHeader title="Eid-bønn" />
          <Card padding="sm" rounded="xl">
            {eidTimes.map((time, index) => (
              <ListRow
                key={`${time}-${index}`}
                title={eidTimes.length > 1 ? `Eid-bønn ${index + 1}` : 'Eid-bønn'}
                leading={<Ionicons name="sparkles-outline" size={20} color={theme.colors.primary} />}
                trailing={
                  <AppText weight="semibold" tabular>
                    {time}
                  </AppText>
                }
                style={{
                  paddingHorizontal: spacing.md,
                  borderBottomWidth: index === eidTimes.length - 1 ? 0 : 1,
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

      {(mosque.contact_name || mosque.contact_phone || mosque.contact_email || mosque.homepage) && (
        <View>
          <SectionHeader title="Kontakt" />
          <Card padding="sm" rounded="xl">
            {mosque.contact_name && (
              <ListRow
                title={mosque.contact_name}
                leading={<Ionicons name="person-outline" size={20} color={theme.colors.primary} />}
                style={{ paddingHorizontal: spacing.md }}
              />
            )}
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
            {mosque.homepage && (
              <ListRow
                title={mosque.homepage.replace(/^https?:\/\//i, '')}
                leading={<Ionicons name="globe-outline" size={20} color={theme.colors.primary} />}
                onPress={() => Linking.openURL(mosque.homepage!).catch(() => {})}
                style={{ paddingHorizontal: spacing.md }}
              />
            )}
          </Card>
        </View>
      )}
    </View>
  );
}
