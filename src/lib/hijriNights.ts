import type { HijriDay } from '@/api/types';
import { parseHijriDate } from './hijri';
import { addIsoDays } from './time';

export type NightDefinition = {
  month: number;
  day: number;
  title: string;
  note: string;
};

export const NOTABLE_NIGHTS: NightDefinition[] = [
  {
    month: 1,
    day: 1,
    title: 'Islamsk nyttår',
    note: 'Den 1. Muharram. Et nytt hijri-år begynner.',
  },
  {
    month: 3,
    day: 12,
    title: 'Mawlid an-Nabi',
    note: 'Den 12. Rabi al-Awal. Profetens fødselsdag.',
  },
  {
    month: 7,
    day: 27,
    title: 'Shab-e-Miraj',
    note: 'Natten til den 27. Rajab. Isra og Miraj.',
  },
  {
    month: 8,
    day: 15,
    title: 'Laylat-ul-Barat',
    note: "Natten til den 15. Sha'ban. Tilgivelsesnatten.",
  },
  {
    month: 9,
    day: 27,
    title: 'Laylat-ul-Qadr',
    note: 'Natten til den 27. Ramadan. Skjebnenatten.',
  },
];

export type UpcomingNight = {
  title: string;
  note: string;
  isoDate: string;
  eveningIso: string;
  isTonight: boolean;
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
  return night.isTonight ? `I natt: ${night.title}` : night.title;
}
