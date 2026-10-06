import type { FeatureFlag } from './featureFlags.ts';
import { t } from './i18n.ts';

export type WhatsNewItem = {
  title: string;
  body: string;
  icon: string;
  route?: string;
  flag?: FeatureFlag;
  platform?: 'ios' | 'android';
};

export type WhatsNewEntry = {
  version: string;
  items: WhatsNewItem[];
};

export const WHATS_NEW: WhatsNewEntry[] = [
  {
    version: '1.9.0',
    items: [
      {
        title: 'Siri',
        body: t('whatsNew.askSiriNarEr'),
        icon: 'mic-outline',
        platform: 'ios',
      },
      {
        title: 'Apple Watch',
        body: t('whatsNew.theNextPrayerAnd'),
        icon: 'watch-outline',
        platform: 'ios',
      },
      {
        title: 'CarPlay',
        body: t('whatsNew.seeTheNextPrayer'),
        icon: 'car-outline',
        platform: 'ios',
      },
      {
        title: t('whatsNew.shortcuts'),
        body: t('whatsNew.pressAndHoldThe'),
        icon: 'flash-outline',
        platform: 'android',
      },
      {
        title: 'Wear OS',
        body: t('whatsNew.theNextPrayerAnd2'),
        icon: 'watch-outline',
        platform: 'android',
      },
      {
        title: t('whatsNew.duaAndDhikr'),
        body: t('whatsNew.duasForPrayerRamadan'),
        icon: 'book-outline',
        route: '/duas',
        flag: 'duas',
      },
      {
        title: t('whatsNew.tasbih'),
        body: t('whatsNew.countDhikrAfterPrayer'),
        icon: 'tasbih',
        route: '/tasbih',
        flag: 'tasbih',
      },
      {
        title: t('whatsNew.hijriCalendar'),
        body: t('whatsNew.theCalendarCanShow'),
        icon: 'calendar-outline',
        route: '/calendar',
      },
      {
        title: t('whatsNew.moreTimesOnThe'),
        body: t('whatsNew.seeDuhaMidnightAnd'),
        icon: 'time-outline',
      },
      {
        title: t('whatsNew.giveUsFeedback'),
        body: t('whatsNew.writeToUsRight'),
        icon: 'chatbubble-ellipses-outline',
        route: '/feedback',
      },
    ],
  },
];

export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export function pendingWhatsNew(
  entries: WhatsNewEntry[],
  lastSeen: string | null,
  current: string,
): WhatsNewEntry[] {
  if (lastSeen == null) return [];
  return entries.filter(
    (entry) => compareVersions(entry.version, lastSeen) > 0 && compareVersions(entry.version, current) <= 0,
  );
}

export function visibleItems(
  items: WhatsNewItem[],
  isEnabled: (flag: FeatureFlag) => boolean,
  platform: string,
): WhatsNewItem[] {
  return items.filter(
    (item) => (item.flag == null || isEnabled(item.flag)) && (item.platform == null || item.platform === platform),
  );
}
