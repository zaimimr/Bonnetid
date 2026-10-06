import type { HijriDay } from '@/api/types';
import { parseHijriDate, type ParsedHijri } from './hijri';
import { daysBetweenIso, formatDayCount } from './time';
import { t } from './i18n.ts';

export type SeasonId = 'ramadan' | 'dhul-hijjah';

export type SeasonDefinition = {
  id: SeasonId;
  month: number;
  firstDay: number;
  lastDay: number;
  countdownDays: number;
};

export type SeasonStatus = {
  id: SeasonId;
  isActive: boolean;
  dayOfSeason: number | null;
  hijriYear: number | null;
  daysUntilStart: number | null;
  startIso: string | null;
};

export const RAMADAN_SEASON: SeasonDefinition = {
  id: 'ramadan',
  month: 9,
  firstDay: 1,
  lastDay: 30,
  countdownDays: 10,
};

export const DHUL_HIJJAH_SEASON: SeasonDefinition = {
  id: 'dhul-hijjah',
  month: 12,
  firstDay: 1,
  lastDay: 10,
  countdownDays: 10,
};

export const SEASONS: SeasonDefinition[] = [RAMADAN_SEASON, DHUL_HIJJAH_SEASON];

export const ARAFAH_DAY = 9;
export const EID_AL_ADHA_DAY = 10;

export const MOON_SIGHTING_NOTE = t({
  nb: 'Datoene følger hijri-kalenderen til Islamsk Råd Norge og kan flytte seg ved månesikting.',
  en: 'Dates follow the Hijri calendar of the Islamic Council of Norway and may shift with moon sighting.',
  ar: 'تتبع التواريخ التقويم الهجري للمجلس الإسلامي النرويجي وقد تتغير بحسب رؤية الهلال.',
  ur: 'تاریخیں اسلامک کونسل ناروے کے ہجری کیلنڈر کے مطابق ہیں اور چاند نظر آنے پر بدل سکتی ہیں۔',
});

export function dhulHijjahDayTitle(day: number | null): string {
  const month = t({ nb: 'Dhul Hijjah', en: 'Dhul Hijjah', ar: 'ذو الحجة', ur: 'ذوالحجہ' });
  if (day == null) return month;
  return t({
    nb: `Dhul Hijjah dag ${day}`,
    en: `Dhul Hijjah day ${day}`,
    ar: `اليوم ${day} من ذي الحجة`,
    ur: `ذوالحجہ، دن ${day}`,
  });
}

export function dhulHijjahHighlight(day: number | null): string | null {
  if (day === ARAFAH_DAY) {
    return t({
      nb: 'Arafah. Fasten er anbefalt for alle som ikke er på hajj.',
      en: 'Arafah. Fasting is recommended for everyone not performing Hajj.',
      ar: 'يوم عرفة. يُستحب صيامه لغير الحاج.',
      ur: 'یوم عرفہ۔ حج نہ کرنے والوں کے لیے روزہ مستحب ہے۔',
    });
  }
  if (day === EID_AL_ADHA_DAY) {
    return t({
      nb: 'Eid al-Adha. I dag faster vi ikke.',
      en: 'Eid al-Adha. We do not fast today.',
      ar: 'عيد الأضحى. لا صيام اليوم.',
      ur: 'عید الاضحی۔ آج روزہ نہیں رکھا جاتا۔',
    });
  }
  if (day == null) return null;
  return t({
    nb: 'De ti første dagene i Dhul Hijjah. Gode gjerninger teller ekstra i disse dagene.',
    en: 'The first ten days of Dhul Hijjah. Good deeds count extra in these days.',
    ar: 'العشر الأوائل من ذي الحجة. للعمل الصالح فيها فضل عظيم.',
    ur: 'ذوالحجہ کے پہلے دس دن۔ ان دنوں میں نیک اعمال کا خاص اجر ہے۔',
  });
}

export function dhulHijjahCountdownText(days: number): string {
  if (days <= 1) {
    return t({
      nb: 'Dhul Hijjah begynner i morgen',
      en: 'Dhul Hijjah begins tomorrow',
      ar: 'يبدأ ذو الحجة غدًا',
      ur: 'ذوالحجہ کل شروع ہو گا',
    });
  }
  return t({
    nb: `Dhul Hijjah begynner om ${days} dager`,
    en: `Dhul Hijjah begins in ${formatDayCount(days)}`,
    ar: `يبدأ ذو الحجة بعد ${formatDayCount(days)}`,
    ur: `ذوالحجہ ${formatDayCount(days)} میں شروع ہو گا`,
  });
}

export function hijriOn(rows: HijriDay[], isoDate: string): ParsedHijri | null {
  const row = rows.find((candidate) => candidate.gregorian_date === isoDate);
  return row ? parseHijriDate(row.hijri_date) : null;
}

export function isInSeason(hijri: ParsedHijri, definition: SeasonDefinition): boolean {
  return (
    hijri.month === definition.month &&
    hijri.day >= definition.firstDay &&
    hijri.day <= definition.lastDay
  );
}

export function seasonDayNumbers(
  rows: HijriDay[],
  definition: SeasonDefinition,
): Map<string, number> {
  const days = new Map<string, number>();
  for (const row of rows) {
    const hijri = parseHijriDate(row.hijri_date);
    if (hijri && isInSeason(hijri, definition)) days.set(row.gregorian_date, hijri.day);
  }
  return days;
}

function seasonStartFrom(
  rows: HijriDay[],
  definition: SeasonDefinition,
  todayIso: string,
  lookaheadDays: number,
): { days: number; year: number; isoDate: string } | null {
  let soonest: { days: number; year: number; isoDate: string } | null = null;
  for (const row of rows) {
    if (row.gregorian_date <= todayIso) continue;
    const hijri = parseHijriDate(row.hijri_date);
    if (!hijri || hijri.month !== definition.month || hijri.day !== definition.firstDay) continue;
    const days = daysBetweenIso(todayIso, row.gregorian_date);
    if (days == null || days <= 0 || days > lookaheadDays) continue;
    if (!soonest || days < soonest.days) {
      soonest = { days, year: hijri.year, isoDate: row.gregorian_date };
    }
  }
  return soonest;
}

export function seasonStatusFrom(
  definition: SeasonDefinition,
  rows: HijriDay[],
  todayIso: string,
  lookaheadDays: number = definition.countdownDays,
): SeasonStatus | null {
  const today = hijriOn(rows, todayIso);

  if (today && isInSeason(today, definition)) {
    return {
      id: definition.id,
      isActive: true,
      dayOfSeason: today.day,
      hijriYear: today.year,
      daysUntilStart: null,
      startIso: null,
    };
  }

  const soonest = seasonStartFrom(rows, definition, todayIso, lookaheadDays);
  if (!soonest) return null;

  return {
    id: definition.id,
    isActive: false,
    dayOfSeason: null,
    hijriYear: soonest.year,
    daysUntilStart: soonest.days,
    startIso: soonest.isoDate,
  };
}

export function activeSeasonStatus(rows: HijriDay[], todayIso: string): SeasonStatus | null {
  const statuses = SEASONS.map((definition) => seasonStatusFrom(definition, rows, todayIso)).filter(
    (status): status is SeasonStatus => status != null,
  );
  return (
    statuses.find((status) => status.isActive) ??
    statuses.sort((a, b) => (a.daysUntilStart ?? 0) - (b.daysUntilStart ?? 0))[0] ??
    null
  );
}
