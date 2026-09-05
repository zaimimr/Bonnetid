import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card } from '@/components/ui';
import { useFontScale } from '@/hooks/useFontScale';
import { useTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';
import { formatCountdownUnits } from '@/lib/time';
import {
  buildDayTimeline,
  fractionOfDay,
  placeableMarks,
  MIDNIGHT_MARK,
  type TimelineMark,
} from '@/lib/dayTimeline';
import type { PrayerEntry } from '@/lib/prayerSchedule';
import { PRAYER_ICONS } from './PrayerTimesCard';

const GLYPH_SLOT = 22;
const GLYPH_SIZE = 14;
const GLYPH_BAND = 20;
const BAR_HEIGHT = 10;
const KNOB_SIZE = 16;
const MARKER_WIDTH = 2;
const MARKER_OVERHANG = 3;
const AXIS_SLOT = 40;
const AXIS_BAND = 18;
const MIDNIGHT_ICON = 'moon-sharp';

const AXIS_LABELS = [
  { fraction: 0, text: '00:00' },
  { fraction: 0.25, text: '06:00' },
  { fraction: 0.5, text: '12:00' },
  { fraction: 0.75, text: '18:00' },
  { fraction: 1, text: '24:00' },
];

export type PrayerTimelineCardProps = {
  schedule: PrayerEntry[];
  dayStart: Date;
  next: PrayerEntry;
  now: Date;
};

function iconFor(mark: TimelineMark): keyof typeof Ionicons.glyphMap {
  return mark.name === MIDNIGHT_MARK ? MIDNIGHT_ICON : PRAYER_ICONS[mark.name];
}

function clampToBar(x: number, width: number, slot: number): number {
  if (width <= slot) return width / 2;
  return Math.min(Math.max(x, slot / 2), width - slot / 2);
}

export function PrayerTimelineCard({ schedule, dayStart, next, now }: PrayerTimelineCardProps) {
  const theme = useTheme();
  const { scale, isStacked } = useFontScale();
  const [barWidth, setBarWidth] = useState(0);

  const timeline = buildDayTimeline(schedule, dayStart);
  if (!timeline) return null;

  const progress = fractionOfDay(timeline, now);
  const marker = timeline.marks.find((mark) => mark.at.getTime() === next.date.getTime()) ?? null;
  const glyphSlot = GLYPH_SLOT * scale;
  const glyphs =
    barWidth > 0 ? placeableMarks(timeline.marks, glyphSlot / barWidth, marker?.at ?? null) : [];

  const onLayout = (event: LayoutChangeEvent) => setBarWidth(event.nativeEvent.layout.width);

  const headline = (
    <View style={{ gap: spacing.xxs }}>
      <AppText size="xxl" weight="bold" tone="primary" heading>
        {next.label}
      </AppText>
      <AppText size="sm" weight="medium" tone="textSecondary" tabular>
        {next.time}
      </AppText>
    </View>
  );

  const countdown = (
    <AppText
      size="xxl"
      weight="bold"
      tabular
      align={isStacked ? 'left' : 'right'}
      numberOfLines={1}
      adjustsFontSizeToFit>
      {formatCountdownUnits(next.date.getTime() - now.getTime())}
    </AppText>
  );

  return (
    <Card rounded="xl" padding="xl" elevated>
      <AppText size="sm" weight="medium" tone="textMuted" align="center">
        Tid igjen til neste salah:
      </AppText>

      <View
        style={{
          marginTop: spacing.md,
          flexDirection: isStacked ? 'column' : 'row',
          alignItems: isStacked ? 'flex-start' : 'flex-end',
          justifyContent: 'space-between',
          gap: spacing.sm,
        }}>
        {headline}
        {countdown}
      </View>

      <View onLayout={onLayout} style={{ marginTop: spacing.xl }}>
        <View style={{ height: GLYPH_BAND }}>
          {glyphs.map((mark) => (
            <View
              key={mark.at.getTime()}
              style={{
                position: 'absolute',
                width: glyphSlot,
                height: GLYPH_BAND,
                alignItems: 'center',
                justifyContent: 'center',
                left: clampToBar(barWidth * mark.fraction, barWidth, glyphSlot) - glyphSlot / 2,
              }}>
              <Ionicons
                name={iconFor(mark)}
                size={GLYPH_SIZE}
                color={
                  mark.at.getTime() === marker?.at.getTime()
                    ? theme.colors.primary
                    : theme.colors.textMuted
                }
              />
            </View>
          ))}
        </View>

        <View style={{ height: KNOB_SIZE, justifyContent: 'center' }}>
          <View
            style={{
              height: BAR_HEIGHT,
              borderRadius: radius.full,
              backgroundColor: theme.colors.track,
              overflow: 'hidden',
            }}>
            <View
              style={{
                position: 'absolute',
                left: 0,
                width: Math.max(barWidth * progress, BAR_HEIGHT),
                height: BAR_HEIGHT,
                borderRadius: radius.full,
                backgroundColor: theme.colors.primary,
              }}
            />

            {timeline.marks.map((mark) => (
              <View
                key={mark.at.getTime()}
                style={{
                  position: 'absolute',
                  width: 1,
                  height: BAR_HEIGHT,
                  backgroundColor:
                    mark.fraction <= progress ? theme.colors.surface : theme.colors.trackMarker,
                  left: clampToBar(barWidth * mark.fraction, barWidth, 1),
                }}
              />
            ))}
          </View>

          {marker && (
            <View
              style={{
                position: 'absolute',
                top: (KNOB_SIZE - BAR_HEIGHT) / 2 - MARKER_OVERHANG,
                width: MARKER_WIDTH,
                height: BAR_HEIGHT + MARKER_OVERHANG * 2,
                borderRadius: radius.sm,
                backgroundColor: theme.colors.trackMarker,
                left:
                  clampToBar(barWidth * marker.fraction, barWidth, MARKER_WIDTH) - MARKER_WIDTH / 2,
              }}
            />
          )}

          <View
            style={{
              position: 'absolute',
              width: KNOB_SIZE,
              height: KNOB_SIZE,
              borderRadius: radius.full,
              backgroundColor: theme.colors.primary,
              borderWidth: 2,
              borderColor: theme.colors.surface,
              left: clampToBar(barWidth * progress, barWidth, KNOB_SIZE) - KNOB_SIZE / 2,
            }}
          />
        </View>

        <View style={{ height: AXIS_BAND, marginTop: spacing.xs }}>
          {AXIS_LABELS.map((label) => (
            <View
              key={label.text}
              style={{
                position: 'absolute',
                width: AXIS_SLOT * scale,
                left:
                  clampToBar(barWidth * label.fraction, barWidth, AXIS_SLOT * scale) -
                  (AXIS_SLOT * scale) / 2,
              }}>
              <AppText size="xs" tone="textMuted" align="center" tabular numberOfLines={1}>
                {label.text}
              </AppText>
            </View>
          ))}
        </View>
      </View>
    </Card>
  );
}
