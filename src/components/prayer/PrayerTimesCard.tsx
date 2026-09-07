import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Badge, Card } from '@/components/ui';
import { useFontScale, scaleWidth } from '@/hooks/useFontScale';
import { useResponsive } from '@/hooks/useResponsive';
import { usePrayerMark } from '@/hooks/usePrayerMark';
import { useTheme } from '@/theme';
import { osloTimeToLocalClock } from '@/lib/time';
import { opacity, radius, spacing } from '@/theme/tokens';
import { statusOf } from '@/lib/prayerLog';
import type { JamatTimes, PrayerEntry, PrayerName } from '@/lib/prayerSchedule';
import type { MosqueJummah } from '@/api/types';
import { usePrayerLog } from '@/store/prayerLog';
import { usePrayerTrackerEnabled } from '@/store/settings';
import { PrayerIcon } from './PrayerIcon';
import { PrayerActionButton, PrayerStatusMark } from './PrayerStatusControl';
import { TimeCell, TimeCellRow, TIME_COLUMN_WIDTH } from './TimeCell';

export type { JamatTimes };

export type PrayerTimesCardProps = {
  schedule: PrayerEntry[];
  highlightedName?: PrayerName;
  mosqueName?: string;
  mosqueNote?: string;
  jamatTimes?: JamatTimes;
  jummah?: MosqueJummah[];
  statusDate?: string;
  now?: Date;
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
  statusDate,
  now,
  onPressMosque,
  onSelectMosque,
}: PrayerTimesCardProps) {
  const theme = useTheme();
  const log = usePrayerLog((state) => state.log);
  const markPrayer = usePrayerMark();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const { scale, isStacked } = useFontScale();
  const { isWide } = useResponsive();
  const stacked = isStacked && !isWide;
  const hasJamat = Object.values(jamatTimes).some(Boolean);
  const trackerEnabled = usePrayerTrackerEnabled();
  const showStatus = trackerEnabled && statusDate != null && now != null;
  const hasMosque = Boolean(mosqueName);
  const columnWidth = scaleWidth(TIME_COLUMN_WIDTH, scale);

  return (
    <Card padding="sm" rounded="xl">
      {hasJamat && !stacked && (
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
            Jamaat
          </AppText>
        </View>
      )}

      {schedule.map((entry, index) => {
        const isHighlighted = entry.name === highlightedName;
        const jamatTime = jamatTimes[entry.name];
        const showLabel = stacked || entry.name !== 'fajr_endtime';
        const status = statusDate ? statusOf(log, statusDate, entry.name) : null;
        const started =
          entry.isPrayer && (now ? entry.date.getTime() <= now.getTime() : false);
        const markable = showStatus && started && statusDate != null;
        const entryKey = `${statusDate}|${entry.name}`;
        const actionOpen = markable && openKey === entryKey;
        const times = (
          <>
            <TimeCell
              value={entry.time}
              label={hasJamat ? 'Adhan' : ''}
              stacked={stacked}
              width={hasJamat ? columnWidth : undefined}
              weight={isHighlighted ? 'bold' : 'medium'}
              tone={entry.isPrayer ? 'textPrimary' : 'textMuted'}
            />
            {hasJamat && (
              <TimeCell
                value={jamatTime ?? '–'}
                label="Jamaat"
                stacked={stacked}
                width={columnWidth}
                weight={isHighlighted ? 'semibold' : 'regular'}
                tone={jamatTime ? 'primary' : 'textMuted'}
              />
            )}
          </>
        );

        return (
          <View
            key={entry.name}
            style={{
              borderRadius: radius.lg,
              backgroundColor: isHighlighted ? theme.colors.primarySoft : 'transparent',
              borderBottomWidth: index === schedule.length - 1 || isHighlighted ? 0 : 1,
              borderBottomColor: theme.colors.border,
            }}>
            <Pressable
              disabled={!markable}
              onPress={() => setOpenKey(actionOpen ? null : entryKey)}
              accessibilityRole={markable ? 'button' : undefined}
              accessibilityLabel={
                markable
                  ? status === 'prayed'
                    ? `${entry.label}, markert som bedt`
                    : `${entry.label}, ikke markert`
                  : undefined
              }
              accessibilityHint={markable ? 'Viser knappen for å markere bønnen' : undefined}
              accessibilityState={markable ? { expanded: actionOpen } : undefined}
              style={({ pressed }) => [
                {
                  flexDirection: 'row',
                  alignItems: stacked ? 'flex-start' : 'center',
                  gap: stacked ? spacing.sm : spacing.md,
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing.md,
                },
                pressed && markable && { opacity: opacity.pressed },
              ]}>
              <PrayerIcon
                name={entry.name}
                size={20}
                color={isHighlighted ? theme.colors.primary : theme.colors.textMuted}
              />
              <View style={{ flex: 1, gap: stacked ? spacing.xs : 0 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    columnGap: spacing.sm,
                    rowGap: spacing.xxs,
                  }}>
                  {showLabel && (
                    <AppText
                      weight={isHighlighted ? 'bold' : entry.isPrayer ? 'medium' : 'regular'}
                      tone={entry.isPrayer ? 'textPrimary' : 'textMuted'}
                      style={{ flexShrink: 1 }}>
                      {entry.label}
                    </AppText>
                  )}
                  {isHighlighted && <Badge label="Nå" variant="primary" />}
                  {markable && status === 'prayed' && <PrayerStatusMark label={entry.label} />}
                </View>
                {stacked && <TimeCellRow>{times}</TimeCellRow>}
              </View>
              {!stacked && times}
            </Pressable>
            {actionOpen && statusDate && (
              <PrayerActionButton
                label={entry.label}
                marked={status === 'prayed'}
                onPress={() => {
                  markPrayer(statusDate, entry.name, status === 'prayed' ? null : 'prayed');
                  setOpenKey(null);
                }}
              />
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
                flexWrap: 'wrap',
                alignItems: 'center',
                columnGap: spacing.md,
                rowGap: spacing.xxs,
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.md,
                borderBottomWidth: index === jummah.length - 1 ? 0 : 1,
                borderBottomColor: theme.colors.border,
              }}>
              <Ionicons name="people-outline" size={18} color={theme.colors.primary} />
              <AppText weight="medium" style={{ flexShrink: 1 }}>
                {jummah.length > 1 ? `Jumuah ${index + 1}` : 'Jumuah'}
              </AppText>
              <AppText weight="semibold" tone="primary" tabular style={{ marginLeft: 'auto' }}>
                {(statusDate && osloTimeToLocalClock(statusDate, entry.jummah)) ?? entry.jummah}
              </AppText>
            </View>
          ))}
        </View>
      )}

      {hasMosque && (
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
          <AppText size="xs" tone="textMuted" style={{ flex: 1 }} numberOfLines={2}>
            {mosqueNote ?? `Jamaat-tider fra ${mosqueName}`}
          </AppText>
          <Ionicons name="chevron-forward" size={14} color={theme.colors.textMuted} />
        </Pressable>
      )}

      {!hasMosque && onSelectMosque && (
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
            Velg din moské for å se jamaat- og jumuah-tider
          </AppText>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
        </Pressable>
      )}
    </Card>
  );
}
