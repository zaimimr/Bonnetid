import type { PrayerDay } from '@/api/types';
import { formatZonedClock, wallClockToDate, type PrayerTimeZone } from './time';
import { t } from './i18n.ts';

export type ExtraTimeName = 'duha' | 'midnight' | 'tahajjud';

export type ExtraTime = {
  name: ExtraTimeName;
  label: string;
  note: string;
  time: string;
  date: Date;
};

export const DUHA_AFTER_SUNRISE_MINUTES = 20;

const MINUTE_MS = 60 * 1000;
const HALF_DAY_MS = 12 * 60 * MINUTE_MS;

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function buildExtraTimes(
  day: PrayerDay,
  baseDate: Date,
  zone: PrayerTimeZone = 'oslo',
  nextDay?: PrayerDay | null,
): ExtraTime[] {
  const at = (clock: string | null, date = baseDate) =>
    clock ? wallClockToDate(date, clock, zone) : null;

  const sunrise = at(day.shuruq_sunrise ?? day.fajr_endtime);
  const noon = at(day.istiwa_noon ?? day.duhr);
  const maghrib = at(day.maghrib);
  const nextFajr = at(nextDay?.fajr ?? day.fajr, addDays(baseDate, 1));

  const entries: Omit<ExtraTime, 'time'>[] = [];

  if (sunrise) {
    entries.push({
      name: 'duha',
      label: t({ nb: 'Duha', en: 'Duha', ar: 'الضحى', ur: 'چاشت' }),
      note: t({
        nb: `Fra ${DUHA_AFTER_SUNRISE_MINUTES} min etter soloppgang til like før middag`,
        en: `From ${DUHA_AFTER_SUNRISE_MINUTES} min after sunrise until just before midday`,
        ar: `من بعد الشروق بـ${DUHA_AFTER_SUNRISE_MINUTES} دقيقة إلى قبيل الزوال`,
        ur: `طلوع آفتاب کے ${DUHA_AFTER_SUNRISE_MINUTES} منٹ بعد سے زوال سے کچھ پہلے تک`,
      }),
      date: new Date(sunrise.getTime() + DUHA_AFTER_SUNRISE_MINUTES * MINUTE_MS),
    });
  }

  if (noon) {
    entries.push({
      name: 'midnight',
      label: t({ nb: 'Midnatt', en: 'Midnight', ar: 'منتصف الليل', ur: 'آدھی رات' }),
      note: t({
        nb: '12 timer etter middag',
        en: '12 hours after midday',
        ar: 'بعد الزوال بـ12 ساعة',
        ur: 'زوال کے 12 گھنٹے بعد',
      }),
      date: new Date(noon.getTime() + HALF_DAY_MS),
    });
  }

  if (maghrib && nextFajr && nextFajr.getTime() > maghrib.getTime()) {
    const night = nextFajr.getTime() - maghrib.getTime();
    entries.push({
      name: 'tahajjud',
      label: t({ nb: 'Tahajjud', en: 'Tahajjud', ar: 'التهجد', ur: 'تہجد' }),
      note: t({
        nb: 'Siste tredjedel av natten, frem til Fajr',
        en: 'Last third of the night, until Fajr',
        ar: 'الثلث الأخير من الليل حتى الفجر',
        ur: 'رات کا آخری تہائی حصہ، فجر تک',
      }),
      date: new Date(maghrib.getTime() + Math.round((night * 2) / 3)),
    });
  }

  return entries
    .map((entry) => ({ ...entry, time: formatZonedClock(entry.date, zone) }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}
