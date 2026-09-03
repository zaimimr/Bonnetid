import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
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
import { PrayerStatusChoice, PrayerStatusControl, STATUS_CONTROL_SIZE } from './PrayerStatusControl';
import { TimeCell, TimeCellRow, TIME_COLUMN_WIDTH } from './TimeCell';

export type { JamatTimes };

const PRAYER_ICONS: Record<PrayerName, keyof typeof Ionicons.glyphMap> = {
  fajr: 'cloudy-night-outline',
  fajr_endtime: 'sunny-outline',
  duhr: 'sunny',
  asr: 'partly-sunny-outline',
  maghrib: 'moon-outline',
  isha: 'moon',
};

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
  const showStatus =
    statusDate != null &&
    now != null &&
    schedule.some((entry) => entry.isPrayer && entry.date.getTime() <= now.getTime());
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
            Jamat
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
        const entryKey = `${statusDate}|${entry.name}`;
        const choiceOpen = openKey === entryKey;
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
                label="Jamat"
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
            <View
              style={{
                flexDirection: 'row',
                alignItems: stacked ? 'flex-start' : 'center',
                gap: stacked ? spacing.sm : spacing.md,
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.md,
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
                </View>
                {stacked && <TimeCellRow>{times}</TimeCellRow>}
              </View>
              {!stacked && times}
              {showStatus && (
                <View style={{ width: STATUS_CONTROL_SIZE, alignItems: 'flex-end' }}>
                  {started && statusDate && (
                    <PrayerStatusControl
                      label={entry.label}
                      status={status}
                      expanded={choiceOpen}
                      onPress={() => {
                        if (status === null && !choiceOpen) {
                          markPrayer(statusDate, entry.name, 'prayed');
                          return;
                        }
                        setOpenKey(choiceOpen ? null : entryKey);
                      }}
                    />
                  )}
                </View>
              )}
            </View>
            {showStatus && started && choiceOpen && statusDate && (
              <PrayerStatusChoice
                label={entry.label}
                status={status}
                onSelect={(next) => {
                  markPrayer(statusDate, entry.name, next);
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
                {jummah.length > 1 ? `Jummah ${index + 1}` : 'Jummah'}
              </AppText>
              <AppText weight="semibold" tone="primary" tabular style={{ marginLeft: 'auto' }}>
                {(statusDate && osloTimeToLocalClock(statusDate, entry.jummah)) ?? entry.jummah}
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
          <AppText size="xs" tone="textMuted" style={{ flex: 1 }} numberOfLines={2}>
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
