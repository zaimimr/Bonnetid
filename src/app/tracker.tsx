import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card, EmptyState, ErrorState, Screen, Skeleton } from '@/components/ui';
import { PrayerActionButton, PrayerStatusMark } from '@/components/prayer/PrayerStatusControl';
import { WeekOverview } from '@/components/prayer/WeekOverview';
import { useActiveDayKeys } from '@/hooks/useActiveDay';
import { useEffectiveAsrMethod } from '@/hooks/useEffectiveAsrMethod';
import { usePrayerMonth, zoneFor } from '@/hooks/usePrayerMonth';
import { useFontScale } from '@/hooks/useFontScale';
import { useNow } from '@/hooks/useNow';
import { usePrayerMark } from '@/hooks/usePrayerMark';
import { usePrayerDay } from '@/hooks/usePrayerDay';
import { useRefresh } from '@/hooks/useRefresh';
import { formatGregorianLong } from '@/lib/hijri';
import { statusOf, weekColumns, weekDayKeys } from '@/lib/prayerLog';
import { buildDaySchedule } from '@/lib/prayerSchedule';
import { isoDateKey, todayKey } from '@/lib/time';
import { useTheme } from '@/theme';
import { hitSlop, opacity, radius, spacing } from '@/theme/tokens';
import { usePrayerLog } from '@/store/prayerLog';
import { useActiveLocation } from '@/store/settings';
import { FeatureGate } from '@/components/FeatureGate';
import { isRTL, t } from '@/lib/i18n';

const MINUTE_MS = 60 * 1000;

function parseIso(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

function shiftIso(isoDate: string, days: number): string {
  const date = parseIso(isoDate);
  date.setDate(date.getDate() + days);
  return isoDateKey(date);
}

function TrackerScreen() {
  const now = useNow();
  const theme = useTheme();
  const location = useActiveLocation();
  const asrMethod = useEffectiveAsrMethod();
  const zone = zoneFor(location);
  const log = usePrayerLog((state) => state.log);
  const markPrayer = usePrayerMark();
  const { isStacked } = useFontScale();
  const { todaySchedule, isLoading, isError, refetch } = usePrayerDay(now);
  const { refreshing, onRefresh } = useRefresh();

  const { isoDate: todayIso } = useActiveDayKeys(now);
  const [selectedIso, setSelectedIso] = useState(todayIso);
  const [openPrayer, setOpenPrayer] = useState<string | null>(null);
  const selected = selectedIso > todayIso ? todayIso : selectedIso;
  const isToday = selected === todayIso;

  const minute = Math.floor(now.getTime() / MINUTE_MS);
  const at = useMemo(() => new Date(minute * MINUTE_MS), [minute]);

  const selectedDate = useMemo(() => parseIso(selected), [selected]);
  const month = usePrayerMonth(location, selectedDate.getFullYear(), selectedDate.getMonth() + 1);
  const row = month.data?.find((day) => day.date === todayKey(selectedDate));

  const schedule = useMemo(() => {
    if (isToday) return todaySchedule.filter((entry) => entry.isPrayer);
    if (!row) return [];
    return buildDaySchedule(row, selectedDate, asrMethod, zone).filter((entry) => entry.isPrayer);
  }, [isToday, todaySchedule, row, selectedDate, asrMethod, zone]);

  const columns = useMemo(
    () => weekColumns(weekDayKeys(selectedDate), todayIso, todaySchedule, log, at),
    [selectedDate, todayIso, todaySchedule, log, at],
  );

  const dayLabel = isToday ? t({ nb: 'I dag', en: 'Today', ar: 'اليوم', ur: 'آج' }) : formatGregorianLong(selectedDate);
  const loading = isLoading || (!isToday && month.isLoading);
  const failed = isError || (!isToday && month.isError);

  return (
    <Screen scroll edges={[]} refreshing={refreshing} onRefresh={onRefresh}>
      <View style={{ marginTop: spacing.lg, gap: spacing.lg }}>
        <WeekOverview
          columns={columns}
          selectedIso={selected}
          onSelect={(isoDate) => {
            setOpenPrayer(null);
            setSelectedIso(isoDate);
          }}
        />

        <View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              marginBottom: spacing.sm,
            }}>
            <DayArrow
              direction="back"
              onPress={() => {
                setOpenPrayer(null);
                setSelectedIso(shiftIso(selected, -1));
              }}
              disabled={false}
            />
            <AppText weight="semibold" align="center" style={{ flex: 1 }} numberOfLines={1}>
              {dayLabel}
            </AppText>
            <DayArrow
              direction="forward"
              onPress={() => {
                setOpenPrayer(null);
                setSelectedIso(shiftIso(selected, 1));
              }}
              disabled={isToday}
            />
          </View>

          {loading && <Skeleton height={240} rounded="xl" />}
          {!loading && failed && <ErrorState onRetry={refetch} />}
          {!loading && !failed && schedule.length === 0 && (
            <EmptyState message={t({ nb: 'Ingen bønnetider for denne dagen', en: 'No prayer times for this day', ar: 'لا توجد مواقيت صلاة لهذا اليوم', ur: 'اس دن کے لیے نماز کے اوقات نہیں' })} icon="time-outline" />
          )}

          {!loading && !failed && schedule.length > 0 && (
            <Card padding="sm" rounded="xl">
              {schedule.map((entry, index) => {
                const status = statusOf(log, selected, entry.name);
                const started = !isToday || entry.date.getTime() <= now.getTime();
                const open = openPrayer === entry.name;
                return (
                  <View
                    key={entry.name}
                    style={{
                      borderTopWidth: index === 0 ? 0 : 1,
                      borderTopColor: theme.colors.border,
                    }}>
                    <Pressable
                      disabled={!started}
                      onPress={() => setOpenPrayer(open ? null : entry.name)}
                      accessibilityRole={started ? 'button' : undefined}
                      accessibilityLabel={
                        started
                          ? status === 'prayed'
                            ? t({
                                nb: `${entry.label}, markert som bedt`,
                                en: `${entry.label}, marked as prayed`,
                                ar: `${entry.label}، مُعلَّمة كمُصلّاة`,
                                ur: `${entry.label}، ادا شدہ کے طور پر نشان زد`,
                              })
                            : t({
                                nb: `${entry.label}, ikke markert`,
                                en: `${entry.label}, not marked`,
                                ar: `${entry.label}، غير مُعلَّمة`,
                                ur: `${entry.label}، نشان زد نہیں`,
                              })
                          : undefined
                      }
                      accessibilityState={started ? { expanded: open } : undefined}
                      style={({ pressed }) => [
                        {
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: spacing.sm,
                          paddingHorizontal: spacing.md,
                          paddingVertical: spacing.md,
                          minHeight: 52,
                        },
                        pressed && started && { opacity: opacity.pressed },
                      ]}>
                      <AppText
                        weight="medium"
                        tone={started ? 'textPrimary' : 'textMuted'}
                        numberOfLines={1}>
                        {entry.label}
                      </AppText>
                      {status === 'prayed' && <PrayerStatusMark label={entry.label} />}
                      <AppText
                        size={isStacked ? 'sm' : 'md'}
                        tone={started ? 'textSecondary' : 'textMuted'}
                        tabular
                        style={{ marginStart: 'auto' }}>
                        {entry.time}
                      </AppText>
                    </Pressable>
                    {started && open && (
                      <PrayerActionButton
                        label={entry.label}
                        marked={status === 'prayed'}
                        onPress={() => {
                          markPrayer(selected, entry.name, status === 'prayed' ? null : 'prayed');
                          setOpenPrayer(null);
                        }}
                      />
                    )}
                  </View>
                );
              })}
            </Card>
          )}
        </View>
      </View>
    </Screen>
  );
}

function DayArrow({
  direction,
  onPress,
  disabled,
}: {
  direction: 'back' | 'forward';
  onPress: () => void;
  disabled: boolean;
}) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={direction === 'back' ? t({ nb: 'Forrige dag', en: 'Previous day', ar: 'اليوم السابق', ur: 'پچھلا دن' }) : t({ nb: 'Neste dag', en: 'Next day', ar: 'اليوم التالي', ur: 'اگلا دن' })}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        {
          width: 40,
          height: 40,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.surfaceSunken,
          opacity: disabled ? opacity.disabled : 1,
        },
        pressed && !disabled && { opacity: opacity.pressed },
      ]}>
      <Ionicons
        name={(direction === 'back') !== isRTL() ? 'chevron-back' : 'chevron-forward'}
        size={20}
        color={theme.colors.textSecondary}
      />
    </Pressable>
  );
}

export default function TrackerScreenRoute() {
  return (
    <FeatureGate flag="prayer-tracker">
      <TrackerScreen />
    </FeatureGate>
  );
}
