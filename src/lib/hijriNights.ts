import type { HijriDay } from '@/api/types';
import { parseHijriDate } from './hijri';
import { addIsoDays } from './time';
import { DUA_LINKS } from './duas';
import { t } from './i18n.ts';

export type NightDefinition = {
  month: number;
  day: number;
  title: string;
  note: string;
  duaId?: string;
};

export const NOTABLE_NIGHTS: NightDefinition[] = [
  {
    month: 1,
    day: 1,
    title: t('season.islamicNewYear'),
    note: t('season.n1MuharramANew'),
  },
  {
    month: 3,
    day: 12,
    title: t('season.mawlidAnNabi'),
    note: t('season.n12RabiAlAwwal'),
  },
  {
    month: 7,
    day: 27,
    title: t('season.shabEMiraj'),
    note: t('season.theNightBefore27'),
  },
  {
    month: 8,
    day: 15,
    title: t('season.laylatAlBaraat'),
    note: t('season.theNightBefore15'),
  },
  {
    month: 9,
    day: 27,
    title: t('season.laylatAlQadr'),
    note: t('season.theNightBefore272'),
    duaId: DUA_LINKS.laylatAlQadr,
  },
];

export type UpcomingNight = {
  title: string;
  note: string;
  isoDate: string;
  eveningIso: string;
  isTonight: boolean;
  duaId?: string;
};

export function nightsIn(rows: HijriDay[]): UpcomingNight[] {
  const nights: UpcomingNight[] = [];
  for (const row of rows) {
    const hijri = parseHijriDate(row.hijri_date);
    if (!hijri) continue;
    const definition = NOTABLE_NIGHTS.find(
      (night) => night.month === hijri.month && night.day === hijri.day,
    );
    if (!definition) continue;
    nights.push({
      title: definition.title,
      note: definition.note,
      isoDate: row.gregorian_date,
      eveningIso: addIsoDays(row.gregorian_date, -1),
      isTonight: false,
      duaId: definition.duaId,
    });
  }
  return nights.sort((a, b) => a.isoDate.localeCompare(b.isoDate));
}

export function currentNight(rows: HijriDay[], todayIso: string): UpcomingNight | null {
  for (const night of nightsIn(rows)) {
    if (night.eveningIso === todayIso) return { ...night, isTonight: true };
    if (night.isoDate === todayIso) return { ...night, isTonight: false };
  }
  return null;
}

export function nightHeadline(night: UpcomingNight): string {
  return night.isTonight
    ? t('season.tonight', { title: night.title })
    : night.title;
}
