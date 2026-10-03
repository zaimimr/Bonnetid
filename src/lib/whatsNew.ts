import type { FeatureFlag } from './featureFlags.ts';

export type WhatsNewItem = {
  title: string;
  body: string;
  icon: string;
  route?: string;
  flag?: FeatureFlag;
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
        title: 'Gi oss tilbakemelding',
        body: 'Skriv til oss rett fra appen under Mer. Vi svarer i appen.',
        icon: 'chatbubble-ellipses-outline',
        route: '/feedback',
      },
      {
        title: 'Dua og dhikr',
        body: 'Duaer til bønnen og Ramadan, med tasbih-teller.',
        icon: 'book-outline',
        route: '/duas',
        flag: 'duas',
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
): WhatsNewItem[] {
  return items.filter((item) => item.flag == null || isEnabled(item.flag));
}
