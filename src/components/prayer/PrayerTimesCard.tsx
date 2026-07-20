import { Pressable, View } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { AppText, Badge, Card } from '@/components/ui';
import { useTheme } from '@/theme';
import { opacity, radius, spacing } from '@/theme/tokens';
import type { JamatTimes, PrayerEntry, PrayerName } from '@/lib/prayerSchedule';
import type { MosqueJummah } from '@/api/types';

export type { JamatTimes };

const PRAYER_ICONS: Record<PrayerName, keyof typeof Ionicons.glyphMap> = {
  fajr: 'cloudy-night-outline',
  fajr_endtime: 'sunny-outline',
  duhr: 'sunny',
  asr: 'partly-sunny-outline',
  maghrib: 'moon-outline',
  isha: 'moon',
};

const TIME_COLUMN_WIDTH = 64;

export type PrayerTimesCardProps = {
  schedule: PrayerEntry[];
  highlightedName?: PrayerName;
  mosqueName?: string;
  mosqueNote?: string;
  jamatTimes?: JamatTimes;
  jummah?: MosqueJummah[];
  onPressMosque?: () => void;
  onSelectMosque?: () => void;
};

export function PrayerTimesCard({
  schedule,
  highlightedName,
  mosqueName,
  mosqueNote,
  jamatTimes = {},
  jummah = [],
  onPressMosque,
  onSelectMosque,
}: PrayerTimesCardProps) {
  const theme = useTheme();
  const hasJamat = Object.values(jamatTimes).some(Boolean);
  const hasMosque = Boolean(mosqueName);

  return (
    <Card padding="sm" rounded="xl">
      {hasJamat && (
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
            style={{ width: TIME_COLUMN_WIDTH }}>
            Adhan
          </AppText>
          <AppText
            size="xs"
            weight="medium"
            tone="textMuted"
            align="right"
            style={{ width: TIME_COLUMN_WIDTH }}>
            Jamat
          </AppText>
        </View>
      )}

      {schedule.map((entry, index) => {
        const isHighlighted = entry.name === highlightedName;
        const jamatTime = jamatTimes[entry.name];
        return (
          <View
            key={entry.name}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.md,
              borderRadius: radius.lg,
              backgroundColor: isHighlighted ? theme.colors.primarySoft : 'transparent',
              borderBottomWidth: index === schedule.length - 1 || isHighlighted ? 0 : 1,
              borderBottomColor: theme.colors.border,
            }}>
            {entry.name === 'fajr_endtime' ? (
              <Feather name="sunrise" size={20} color={theme.colors.textMuted} />
            ) : (
              <Ionicons
                name={PRAYER_ICONS[entry.name]}
                size={20}
                color={isHighlighted ? theme.colors.primary : theme.colors.textMuted}
              />
            )}
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              {entry.name !== 'fajr_endtime' && (
                <AppText
                  weight={isHighlighted ? 'bold' : entry.isPrayer ? 'medium' : 'regular'}
                  tone={entry.isPrayer ? 'textPrimary' : 'textMuted'}>
                  {entry.label}
                </AppText>
              )}
              {isHighlighted && <Badge label="Nå" variant="primary" />}
            </View>
            <AppText
              weight={isHighlighted ? 'bold' : 'medium'}
              tone={entry.isPrayer ? 'textPrimary' : 'textMuted'}
              align="right"
              tabular
              style={hasJamat ? { width: TIME_COLUMN_WIDTH } : undefined}>
              {entry.time}
            </AppText>
            {hasJamat && (
              <AppText
                size="md"
                weight={isHighlighted ? 'semibold' : 'regular'}
                tone={jamatTime ? 'primary' : 'textMuted'}
                align="right"
                tabular
                style={{ width: TIME_COLUMN_WIDTH }}>
                {jamatTime ?? '–'}
              </AppText>
            )}
          </View>
        );
      })}

      {hasMosque && jummah.length > 0 && (
        <View
          style={{
            marginTop: spacing.xs,
            marginHorizontal: spacing.xs,
            marginBottom: spacing.xs,
            backgroundColor: theme.colors.surfaceSunken,
            borderRadius: radius.lg,
            paddingVertical: spacing.xs,
          }}>
          {jummah.map((entry, index) => (
            <View
              key={entry.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.md,
                borderBottomWidth: index === jummah.length - 1 ? 0 : 1,
                borderBottomColor: theme.colors.border,
              }}>
              <Ionicons name="people-outline" size={18} color={theme.colors.primary} />
              <AppText weight="medium" style={{ flex: 1 }}>
                {jummah.length > 1 ? `Jummah ${index + 1}` : 'Jummah'}
              </AppText>
              <AppText weight="semibold" tone="primary" tabular>
                {entry.jummah}
              </AppText>
            </View>
          ))}
        </View>
      )}

      {hasMosque ? (
        <Pressable
          onPress={onPressMosque}
          style={({ pressed }) => [
            {
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.md,
              borderTopWidth: 1,
              borderTopColor: theme.colors.border,
            },
            pressed && { opacity: opacity.pressed },
          ]}>
          <Ionicons name="business-outline" size={15} color={theme.colors.textMuted} />
          <AppText size="xs" tone="textMuted" style={{ flex: 1 }} numberOfLines={1}>
            {mosqueNote ?? `Jamat-tider fra ${mosqueName}`}
          </AppText>
          <Ionicons name="chevron-forward" size={14} color={theme.colors.textMuted} />
        </Pressable>
      ) : (
        <Pressable
          onPress={onSelectMosque}
          style={({ pressed }) => [
            {
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.md,
              borderTopWidth: 1,
              borderTopColor: theme.colors.border,
            },
            pressed && { opacity: opacity.pressed },
          ]}>
          <Ionicons name="business-outline" size={18} color={theme.colors.primary} />
          <AppText size="sm" weight="medium" tone="primary" style={{ flex: 1 }}>
            Velg din moské for å se jamat- og jummah-tider
          </AppText>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
        </Pressable>
      )}
    </Card>
  );
}
