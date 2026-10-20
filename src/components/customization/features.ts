import type { Href } from 'expo-router';
import type { IconName } from '@/components/icons';
import { FEATURE_IDS, type FeatureId, type HomeBlockId } from '@/lib/customization';
import { useFeature } from '@/hooks/useFeature';
import { useIsCalculatedMode, usePrayerTrackerEnabled } from '@/store/settings';
import { t } from '@/lib/i18n';

export type FeatureMeta = {
  icon: IconName;
  label: string;
  title: string;
  href: Href;
  route: string;
};

export const FEATURES: Record<FeatureId, FeatureMeta> = {
  calendar: {
    icon: 'calendar-dots',
    label: t('customize.feature.calendar'),
    title: t('navigation.calendar'),
    href: '/calendar',
    route: 'calendar',
  },
  qibla: {
    icon: 'compass',
    label: t('customize.feature.qibla'),
    title: t('navigation.qibla'),
    href: '/qibla',
    route: 'qibla',
  },
  mosques: {
    icon: 'mosque',
    label: t('customize.feature.mosques'),
    title: t('navigation.mosques'),
    href: '/mosques',
    route: 'tab-mosques',
  },
  jumuah: {
    icon: 'minbar',
    label: t('customize.feature.jumuah'),
    title: t('mosque.jumuah'),
    href: { pathname: '/mosques', params: { jumuah: '1' } },
    route: 'tab-jumuah',
  },
  duas: {
    icon: 'dua-hands',
    label: t('customize.feature.duas'),
    title: t('navigation.duaAndDhikr'),
    href: '/duas',
    route: 'tab-duas',
  },
  tasbih: {
    icon: 'tasbih',
    label: t('customize.feature.tasbih'),
    title: t('navigation.tasbih'),
    href: '/tasbih',
    route: 'tab-tasbih',
  },
  tracker: {
    icon: 'prayer-tracker',
    label: t('customize.feature.tracker'),
    title: t('navigation.prayerTracker'),
    href: '/tracker',
    route: 'tab-tracker',
  },
};

export function useAvailableFeatures(): FeatureId[] {
  const calculated = useIsCalculatedMode();
  const duas = useFeature('duas');
  const tasbih = useFeature('tasbih');
  const tracker = usePrayerTrackerEnabled();
  const available: Record<FeatureId, boolean> = {
    calendar: true,
    qibla: true,
    mosques: !calculated,
    jumuah: !calculated,
    duas,
    tasbih,
    tracker,
  };
  return FEATURE_IDS.filter((id) => available[id]);
}

export const HOME_BLOCKS: Record<HomeBlockId, { label: string; icon: IconName }> = {
  'next-prayer': { label: t('customize.block.nextPrayer'), icon: 'timer' },
  shortcuts: { label: t('customize.block.shortcuts'), icon: 'squares-four' },
  'after-prayer': { label: t('customize.block.afterPrayer'), icon: 'dua-hands' },
  announcement: { label: t('customize.block.announcement'), icon: 'megaphone' },
  season: { label: t('customize.block.season'), icon: 'lantern' },
  night: { label: t('customize.block.night'), icon: 'moon-stars' },
  'prayer-times': { label: t('customize.block.prayerTimes'), icon: 'clock' },
  'special-days': { label: t('customize.block.specialDays'), icon: 'star-and-crescent' },
};
