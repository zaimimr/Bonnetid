import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMosque } from '@/api/queries';
import { AppText, Button, Card, Skeleton } from '@/components/ui';
import { useTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';
import { PRAYER_LABELS } from '@/lib/prayerSchedule';
import type { SavedMosque } from '@/store/settings';

export type MyMosqueCardProps = {
  mosque: SavedMosque | null;
  onSelectMosque: () => void;
  onOpenMosque: (orgNr: string) => void;
};

export function MyMosqueCard({ mosque, onSelectMosque, onOpenMosque }: MyMosqueCardProps) {
  if (!mosque) {
    return <SelectMosquePrompt onSelectMosque={onSelectMosque} />;
  }
  return <MosqueTimes mosque={mosque} onOpenMosque={onOpenMosque} />;
}

function SelectMosquePrompt({ onSelectMosque }: { onSelectMosque: () => void }) {
  const theme = useTheme();
  return (
    <Card rounded="xl" padding="xl">
      <View style={{ alignItems: 'center', gap: spacing.md }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: radius.full,
            backgroundColor: theme.colors.primarySoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Ionicons name="business-outline" size={26} color={theme.colors.primary} />
        </View>
        <AppText weight="semibold" align="center">
          Velg din moské
        </AppText>
        <AppText size="sm" tone="textSecondary" align="center">
          Se jamat- og jummah-tider fra moskeen din direkte på hjemskjermen.
        </AppText>
        <Button label="Velg moské" onPress={onSelectMosque} />
      </View>
    </Card>
  );
}

function MosqueTimes({
  mosque,
  onOpenMosque,
}: {
  mosque: SavedMosque;
  onOpenMosque: (orgNr: string) => void;
}) {
  const theme = useTheme();
  const { data, isLoading } = useMosque(mosque.orgNr);

  const jamat = data?.jamat;
  const jamatEntries = jamat
    ? (
        [
          ['fajr', jamat.fajr],
          ['duhr', jamat.duhr],
          ['asr', jamat.asr],
          ['maghrib', jamat.maghrib],
          ['isha', jamat.isha],
        ] as [keyof typeof PRAYER_LABELS, string | null][]
      ).filter((entry): entry is [keyof typeof PRAYER_LABELS, string] => entry[1] != null)
    : [];

  const jummahTimes = data?.jummah ?? [];

  return (
    <Card rounded="xl" onPress={() => onOpenMosque(mosque.orgNr)}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Ionicons name="business" size={18} color={theme.colors.primary} />
        <AppText weight="semibold" style={{ flex: 1 }} numberOfLines={1}>
          {mosque.name}
        </AppText>
        <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
      </View>

      {isLoading && <Skeleton height={64} rounded="md" style={{ marginTop: spacing.md }} />}

      {!isLoading && jamatEntries.length === 0 && jummahTimes.length === 0 && (
        <AppText size="sm" tone="textMuted" style={{ marginTop: spacing.md }}>
          Moskeen har ikke publisert jamat-tider ennå.
        </AppText>
      )}

      {jamatEntries.length > 0 && (
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap' }}>
          {jamatEntries.map(([name, time]) => (
            <View
              key={name}
              style={{
                backgroundColor: theme.colors.surfaceSunken,
                borderRadius: radius.md,
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.md,
                alignItems: 'center',
                gap: spacing.xxs,
                minWidth: 60,
              }}>
              <AppText size="xs" tone="textMuted">
                {PRAYER_LABELS[name]}
              </AppText>
              <AppText size="sm" weight="semibold" tabular>
                {time}
              </AppText>
            </View>
          ))}
        </View>
      )}

      {jummahTimes.length > 0 && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            marginTop: spacing.md,
            backgroundColor: theme.colors.primarySoft,
            borderRadius: radius.md,
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
          }}>
          <Ionicons name="people-outline" size={16} color={theme.colors.onPrimarySoft} />
          <AppText size="sm" weight="medium" tone="onPrimarySoft" style={{ flex: 1 }}>
            Jummah
          </AppText>
          <AppText size="sm" weight="bold" tone="onPrimarySoft" tabular>
            {jummahTimes.map((entry) => entry.jummah).join(' · ')}
          </AppText>
        </View>
      )}
    </Card>
  );
}
