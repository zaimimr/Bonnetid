import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card, Divider } from '@/components/ui';
import { ReachPill } from '@/components/mosque/JummahMosqueCard';
import { useFontScale } from '@/hooks/useFontScale';
import { useJummahFinder } from '@/hooks/useJummahFinder';
import { formatDistance } from '@/lib/geo';
import type { RankedJummah } from '@/lib/jummahFinder';
import { useTheme } from '@/theme';
import { hitSlop, opacity, spacing } from '@/theme/tokens';

const PREVIEW_COUNT = 2;

export function JummahHomeCard() {
  const router = useRouter();
  const theme = useTheme();
  const finder = useJummahFinder();

  if (!finder.isFriday || finder.isLoading || finder.isError) return null;

  const worthShowing = finder.ranked.filter((item) => item.reach !== 'far');
  const preview = worthShowing.slice(0, PREVIEW_COUNT);
  const open = () => router.push('/jummah');

  const emptyMessage =
    finder.ranked.length === 0
      ? 'Vi har ingen registrerte fredagstider i nærheten. Det betyr ikke at moskeene mangler jummah, bare at tiden ikke er registrert hos oss.'
      : 'Alle moskeene med registrert fredagstid ligger for langt unna deg akkurat nå.';

  return (
    <Card rounded="xl" elevated>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          marginBottom: spacing.md,
        }}>
        <Ionicons name="people-outline" size={20} color={theme.colors.primary} />
        <AppText weight="bold" heading style={{ flex: 1 }}>
          Nærmeste jummah
        </AppText>
      </View>

      {preview.length === 0 ? (
        <AppText size="sm" tone="textSecondary">
          {emptyMessage}
        </AppText>
      ) : (
        <View>
          {preview.map((item, index) => (
            <View key={item.orgNr}>
              {index > 0 && <Divider />}
              <PreviewRow
                item={item}
                onPress={() =>
                  router.push({ pathname: '/mosque/[orgNr]', params: { orgNr: item.orgNr } })
                }
              />
            </View>
          ))}
        </View>
      )}

      <Pressable
        onPress={open}
        hitSlop={hitSlop}
        style={({ pressed }) => [
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs,
            marginTop: spacing.md,
            minHeight: 44,
          },
          pressed && { opacity: opacity.pressed },
        ]}>
        <AppText size="sm" weight="semibold" tone="primary">
          {worthShowing.length > PREVIEW_COUNT
            ? `Se alle ${finder.ranked.length} fredagstider`
            : 'Se alle fredagstider'}
        </AppText>
        <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
      </Pressable>
    </Card>
  );
}

function PreviewRow({ item, onPress }: { item: RankedJummah; onPress: () => void }) {
  const { isStacked } = useFontScale();
  const detail = [
    item.distanceKm != null ? formatDistance(item.distanceKm) : null,
    item.minutesUntilStart != null && item.minutesUntilStart > 0
      ? `om ${item.minutesUntilStart} min`
      : null,
  ]
    .filter((part): part is string => part != null)
    .join(' · ');

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: isStacked ? 'column' : 'row',
          alignItems: isStacked ? 'flex-start' : 'center',
          gap: spacing.sm,
          paddingVertical: spacing.sm,
          minHeight: 44,
        },
        pressed && { opacity: opacity.pressed },
      ]}>
      <View style={{ flex: isStacked ? undefined : 1, gap: spacing.xxs }}>
        <AppText weight="semibold" numberOfLines={2}>
          {item.name}
        </AppText>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            columnGap: spacing.sm,
            rowGap: spacing.xs,
          }}>
          <ReachPill reach={item.reach} />
          {detail ? (
            <AppText size="sm" tone="textMuted" style={{ flexShrink: 1 }}>
              {detail}
            </AppText>
          ) : null}
        </View>
      </View>
      <AppText size="xl" weight="bold" tabular>
        {item.slot?.time ?? '–'}
      </AppText>
    </Pressable>
  );
}
