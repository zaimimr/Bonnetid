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
    title: t({ nb: 'Islamsk nyttår', en: 'Islamic New Year', ar: 'رأس السنة الهجرية', ur: 'اسلامی نیا سال' }),
    note: t({
      nb: 'Den 1. Muharram. Et nytt hijri-år begynner.',
      en: '1 Muharram. A new Hijri year begins.',
      ar: '1 محرم. تبدأ سنة هجرية جديدة.',
      ur: '1 محرم۔ نیا ہجری سال شروع ہوتا ہے۔',
    }),
  },
  {
    month: 3,
    day: 12,
    title: t({ nb: 'Mawlid an-Nabi', en: 'Mawlid an-Nabi', ar: 'المولد النبوي', ur: 'میلاد النبی' }),
    note: t({
      nb: 'Den 12. Rabi al-Awal. Profetens fødselsdag.',
      en: "12 Rabi al-Awwal. The Prophet's birthday.",
      ar: '12 ربيع الأول. ذكرى مولد النبي ﷺ.',
      ur: '12 ربیع الاول۔ نبی کریم ﷺ کی ولادت۔',
    }),
  },
  {
    month: 7,
    day: 27,
    title: t({ nb: 'Shab-e-Miraj', en: 'Shab-e-Miraj', ar: 'ليلة الإسراء والمعراج', ur: 'شب معراج' }),
    note: t({
      nb: 'Natten til den 27. Rajab. Isra og Miraj.',
      en: 'The night before 27 Rajab. Isra and Miraj.',
      ar: 'ليلة 27 رجب. الإسراء والمعراج.',
      ur: '27 رجب کی رات۔ اسراء و معراج۔',
    }),
  },
  {
    month: 8,
    day: 15,
    title: t({ nb: 'Laylat-ul-Barat', en: 'Laylat al-Baraat', ar: 'ليلة النصف من شعبان', ur: 'شب برات' }),
    note: t({
      nb: "Natten til den 15. Sha'ban. Tilgivelsesnatten.",
      en: 'The night before 15 Shaban. The Night of Forgiveness.',
      ar: 'ليلة 15 شعبان.',
      ur: '15 شعبان کی رات۔ مغفرت کی رات۔',
    }),
  },
  {
    month: 9,
    day: 27,
    title: t({ nb: 'Laylat-ul-Qadr', en: 'Laylat al-Qadr', ar: 'ليلة القدر', ur: 'لیلۃ القدر' }),
    note: t({
      nb: 'Natten til den 27. Ramadan. Skjebnenatten.',
      en: 'The night before 27 Ramadan. The Night of Decree.',
      ar: 'ليلة 27 رمضان.',
      ur: '27 رمضان کی رات۔ شب قدر۔',
    }),
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
    ? t({
        nb: `I natt: ${night.title}`,
        en: `Tonight: ${night.title}`,
        ar: `الليلة: ${night.title}`,
        ur: `آج رات: ${night.title}`,
      })
    : night.title;
}
