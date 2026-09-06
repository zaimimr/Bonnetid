import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card, EmptyState, ErrorState, Screen, Skeleton } from '@/components/ui';
import { JummahMosqueCard } from '@/components/mosque/JummahMosqueCard';
import { useJummahFinder } from '@/hooks/useJummahFinder';
import { useRefresh } from '@/hooks/useRefresh';
import { JUMMAH_ARRIVAL_BUFFER_MINUTES, JUMMAH_AVERAGE_SPEED_KMH } from '@/lib/jummahFinder';
import { useTheme } from '@/theme';
import { hitSlop, opacity, radius, spacing } from '@/theme/tokens';

const TRAVEL_ASSUMPTION = `Vi anslår reisetiden med ${JUMMAH_AVERAGE_SPEED_KMH} km/t i luftlinje pluss ${JUMMAH_ARRIVAL_BUFFER_MINUTES} minutter til parkering. Det er et grovt anslag, ikke en ruteberegning.`;

export default function JummahScreen() {
  const router = useRouter();
  const theme = useTheme();
  const finder = useJummahFinder();
  const { refreshing, onRefresh } = useRefresh();

  const openMosque = (orgNr: string) =>
    router.push({ pathname: '/mosque/[orgNr]', params: { orgNr } });

  return (
    <Screen scroll edges={[]} refreshing={refreshing} onRefresh={onRefresh}>
      <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
        <AppText size="xxl" weight="bold" heading>
          {finder.isFriday ? 'Fredagsbønn i dag' : 'Fredagsbønn'}
        </AppText>

        {!finder.isFriday && (
          <Note
            icon="calendar-outline"
            text="I dag er det ikke fredag. Tidene under gjelder fredager, sortert etter avstand."
          />
        )}

        {finder.isAbroad && (
          <Note
            icon="airplane-outline"
            text="Du ser ut til å være utenfor Norge. Listen viser moskeer i Norge, så tidene passer sannsynligvis ikke der du er nå."
          />
        )}

        {!finder.hasLocation && !finder.isAbroad && (
          <Note
            icon="location-outline"
            text={`Vi bruker stedet du har valgt, ${finder.locationName}, ikke GPS. Slå på stedstilgang for et riktigere anslag.`}
          />
        )}
      </View>

      {finder.isLoading && (
        <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} height={116} rounded="xl" />
          ))}
        </View>
      )}

      {finder.isError && <ErrorState onRetry={finder.refetch} />}

      {!finder.isLoading && !finder.isError && finder.ranked.length === 0 && (
        <EmptyState
          icon="time-outline"
          message="Vi har ingen registrerte fredagstider ennå. Det betyr ikke at moskeene mangler jummah, bare at tiden ikke er registrert hos oss."
        />
      )}

      {!finder.isLoading && !finder.isError && finder.ranked.length > 0 && (
        <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
          {finder.ranked.map((item) => (
            <JummahMosqueCard
              key={item.orgNr}
              item={item}
              onPress={() => openMosque(item.orgNr)}
            />
          ))}
        </View>
      )}

      {!finder.isLoading && !finder.isError && (
        <Card rounded="xl" style={{ marginTop: spacing.xl, gap: spacing.sm }}>
          {finder.isFriday && <AppText size="sm" tone="textMuted">{TRAVEL_ASSUMPTION}</AppText>}
          <AppText size="sm" tone="textMuted">
            {`Vi har fredagstider for ${finder.withJummahCount} av ${finder.mosqueCount} moskeer.`}
          </AppText>
          {finder.nearbyWithoutJummahCount > 0 && (
            <AppText size="sm" tone="textMuted">
              {`${finder.nearbyWithoutJummahCount} moskeer i nærheten mangler registrert fredagstid hos oss. Det betyr ikke at de ikke holder jummah.`}
            </AppText>
          )}
          <Pressable
            onPress={() => router.push('/mosques')}
            hitSlop={hitSlop}
            style={({ pressed }) => [
              { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, minHeight: 44 },
              pressed && { opacity: opacity.pressed },
            ]}>
            <AppText size="sm" tone="primary" weight="semibold">
              Se alle moskeer
            </AppText>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
          </Pressable>
        </Card>
      )}
    </Screen>
  );
}

type NoteProps = {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
};

function Note({ icon, text }: NoteProps) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: spacing.sm,
        alignItems: 'flex-start',
        backgroundColor: theme.colors.surfaceSunken,
        borderRadius: radius.md,
        padding: spacing.md,
      }}>
      <Ionicons name={icon} size={18} color={theme.colors.textMuted} />
      <AppText size="sm" tone="textSecondary" style={{ flex: 1 }}>
        {text}
      </AppText>
    </View>
  );
}
