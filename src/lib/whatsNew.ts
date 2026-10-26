import type { IconName } from '../components/icons/Icon.tsx';
import type { FeatureFlag } from './featureFlags.ts';
import { t } from './i18n.ts';

export type WhatsNewItem = {
  title: string;
  body: string;
  icon: IconName;
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
    version: '1.11.0',
    items: [
      { title: t('whatsNew.customize'), body: t('whatsNew.customizeBody'), icon: 'sliders-horizontal' },
      { title: t('whatsNew.clockChange'), body: t('whatsNew.clockChangeBody'), icon: 'clock' },
      { title: t('whatsNew.calmerQibla'), body: t('whatsNew.calmerQiblaBody'), icon: 'compass' },
      { title: t('whatsNew.vippsLink'), body: t('whatsNew.vippsLinkBody'), icon: 'heart' },
    ],
  },
  {
    version: '1.10.0',
    items: [
      { title: t('whatsNew.newWidgets'), body: t('whatsNew.newWidgetsBody'), icon: 'squares-four' },
      { title: t('whatsNew.hijriWidget'), body: t('whatsNew.hijriWidgetBody'), icon: 'calendar-dots' },
    ],
  },
  {
    version: '1.9.3',
    items: [
      { title: t('whatsNew.languages'), body: t('whatsNew.languagesBody'), icon: 'translate' },
      { title: t('whatsNew.newSettings'), body: t('whatsNew.newSettingsBody'), icon: 'gear-six' },
      { title: t('whatsNew.jumuahFriday'), body: t('whatsNew.jumuahFridayBody'), icon: 'users-three' },
      { title: t('whatsNew.vippsCopy'), body: t('whatsNew.vippsCopyBody'), icon: 'heart' },
    ],
  },
  {
    version: '1.9.0',
    items: [
      {
        title: 'Siri',
        body: t('whatsNew.askSiriNarEr'),
        icon: 'microphone',
        platform: 'ios',
      },
      {
        title: 'Apple Watch',
        body: t('whatsNew.theNextPrayerAnd'),
        icon: 'watch',
        platform: 'ios',
      },
      {
        title: 'CarPlay',
        body: t('whatsNew.seeTheNextPrayer'),
        icon: 'car',
        platform: 'ios',
      },
      {
        title: t('whatsNew.shortcuts'),
        body: t('whatsNew.pressAndHoldThe'),
        icon: 'lightning',
        platform: 'android',
      },
      {
        title: 'Wear OS',
        body: t('whatsNew.theNextPrayerAnd2'),
        icon: 'watch',
        platform: 'android',
      },
      {
        title: t('whatsNew.duaAndDhikr'),
        body: t('whatsNew.duasForPrayerRamadan'),
        icon: 'book-open',
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
        icon: 'calendar-dots',
        route: '/calendar',
      },
      {
        title: t('whatsNew.moreTimesOnThe'),
        body: t('whatsNew.seeDuhaMidnightAnd'),
        icon: 'clock',
      },
      {
        title: t('whatsNew.giveUsFeedback'),
        body: t('whatsNew.writeToUsRight'),
        icon: 'chat-circle-dots',
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
