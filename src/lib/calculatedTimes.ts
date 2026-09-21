import {
  CalculationMethod,
  Coordinates,
  HighLatitudeRule,
  Madhab,
  PolarCircleResolution,
  PrayerTimes,
  SunnahTimes,
  type CalculationParameters,
} from 'adhan';
import type { HijriDay, PrayerDay } from '@/api/types';
import { CALCULATED_LOCATION_ISO } from '@/store/settings';
import { DEFAULT_CALCULATION_METHOD, type CalculationMethodKey } from './calculationMethods';
import { formatZonedClock, isoDateKey, todayKey, type PrayerTimeZone } from './time';

const HALF = 0.5;

const METHOD_FACTORIES: Record<CalculationMethodKey, () => CalculationParameters> = {
  mwl: CalculationMethod.MuslimWorldLeague,
  isna: CalculationMethod.NorthAmerica,
  umm_al_qura: CalculationMethod.UmmAlQura,
  karachi: CalculationMethod.Karachi,
  egyptian: CalculationMethod.Egyptian,
  dubai: CalculationMethod.Dubai,
  kuwait: CalculationMethod.Kuwait,
  qatar: CalculationMethod.Qatar,
  singapore: CalculationMethod.Singapore,
  tehran: CalculationMethod.Tehran,
  turkey: CalculationMethod.Turkey,
};

export type CalculatedDayInput = {
  lat: number;
  lon: number;
  date: Date;
  method: CalculationMethodKey;
  hijriDate: string;
  /** The clock the place itself keeps, so the times stay right on a phone set elsewhere. */
  timeZone: PrayerTimeZone;
};

function parametersFor(method: CalculationMethodKey, coordinates: Coordinates) {
  const factory = METHOD_FACTORIES[method] ?? METHOD_FACTORIES[DEFAULT_CALCULATION_METHOD];
  const parameters = factory();
  parameters.highLatitudeRule = HighLatitudeRule.recommended(coordinates);
  parameters.polarCircleResolution = PolarCircleResolution.AqrabBalad;
  return parameters;
}

function clockIn(zone: PrayerTimeZone) {
  return (instant: Date | null | undefined): string | null => {
    if (!instant || Number.isNaN(instant.getTime())) return null;
    return formatZonedClock(instant, zone);
  };
}

function midpoint(from: Date, to: Date): Date {
  return new Date(from.getTime() + (to.getTime() - from.getTime()) * HALF);
}

export function calculatePrayerDay(input: CalculatedDayInput): PrayerDay {
  const coordinates = new Coordinates(input.lat, input.lon);
  const parameters = parametersFor(input.method, coordinates);

  parameters.madhab = Madhab.Shafi;
  const standard = new PrayerTimes(coordinates, input.date, parameters);

  parameters.madhab = Madhab.Hanafi;
  const hanafi = new PrayerTimes(coordinates, input.date, parameters);

  const night = new SunnahTimes(standard);
  const wusta = midpoint(standard.dhuhr, standard.sunset);
  const clock = clockIn(input.timeZone);

  return {
    location: CALCULATED_LOCATION_ISO,
    date: todayKey(input.date),
    kommune: null,
    hijri_date: input.hijriDate,
    fajr: clock(standard.fajr),
    fajr_endtime: clock(standard.sunrise),
    shuruq_sunrise: clock(standard.sunrise),
    istiwa_noon: clock(standard.dhuhr),
    duhr: clock(standard.dhuhr),
    asr: clock(standard.asr),
    shadow_1x: clock(standard.asr),
    shadow_2x: clock(hanafi.asr),
    wusta_noon_sunset: clock(wusta),
    asr_endtime: clock(standard.maghrib),
    ghrub_sunset: clock(standard.sunset),
    maghrib: clock(standard.maghrib),
    isha: clock(standard.isha),
    muntasafallayl_midnight: clock(night.middleOfTheNight),
  };
}

export type CalculatedMonthInput = {
  lat: number;
  lon: number;
  year: number;
  month: number;
  method: CalculationMethodKey;
  hijriDays: HijriDay[];
  timeZone: PrayerTimeZone;
};

function hijriLookup(hijriDays: HijriDay[]): Map<string, string> {
  return new Map(
    hijriDays.map((day) => [day.gregorian_date, day.hijri_date.split('-').reverse().join('-')]),
  );
}

export function calculatePrayerMonth(input: CalculatedMonthInput): PrayerDay[] {
  const lastDay = new Date(input.year, input.month, 0).getDate();
  const hijriByDate = hijriLookup(input.hijriDays);

  return Array.from({ length: lastDay }, (_, index) => {
    const date = new Date(input.year, input.month - 1, index + 1);
    return calculatePrayerDay({
      lat: input.lat,
      lon: input.lon,
      date,
      method: input.method,
      hijriDate: hijriByDate.get(isoDateKey(date)) ?? '',
      timeZone: input.timeZone,
    });
  });
}
