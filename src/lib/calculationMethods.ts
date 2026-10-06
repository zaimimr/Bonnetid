import { t } from './i18n.ts';

export type CalculationMethodKey =
  | 'mwl'
  | 'isna'
  | 'umm_al_qura'
  | 'karachi'
  | 'egyptian'
  | 'dubai'
  | 'kuwait'
  | 'qatar'
  | 'singapore'
  | 'tehran'
  | 'turkey';

export type CalculationMethodOption = {
  value: CalculationMethodKey;
  label: string;
  description: string;
};

export const DEFAULT_CALCULATION_METHOD: CalculationMethodKey = 'mwl';

export const CALCULATION_METHOD_OPTIONS: CalculationMethodOption[] = [
  {
    value: 'mwl',
    label: t({
      nb: 'Muslim World League',
      en: 'Muslim World League',
      ar: 'رابطة العالم الإسلامي',
      ur: 'مسلم ورلڈ لیگ',
    }),
    description: t({
      nb: 'Vanligst i Europa. Fajr 18°, isha 17°',
      en: 'Most common in Europe. Fajr 18°, Isha 17°',
      ar: 'الأكثر شيوعًا في أوروبا. الفجر 18°، العشاء 17°',
      ur: 'یورپ میں سب سے عام۔ فجر 18°، عشاء 17°',
    }),
  },
  {
    value: 'isna',
    label: t({
      nb: 'ISNA',
      en: 'ISNA',
      ar: 'ISNA',
      ur: 'ISNA',
    }),
    description: t({
      nb: 'Nord-Amerika. Senere fajr og tidligere isha, 15°',
      en: 'North America. Later Fajr and earlier Isha, 15°',
      ar: 'أمريكا الشمالية. فجر متأخر وعشاء مبكر، 15°',
      ur: 'شمالی امریکہ۔ فجر دیر سے اور عشاء جلدی، 15°',
    }),
  },
  {
    value: 'umm_al_qura',
    label: t({
      nb: 'Umm al-Qura',
      en: 'Umm al-Qura',
      ar: 'أم القرى',
      ur: 'ام القریٰ',
    }),
    description: t({
      nb: 'Saudi-Arabia. Isha 90 minutter etter maghrib',
      en: 'Saudi Arabia. Isha 90 minutes after Maghrib',
      ar: 'السعودية. العشاء بعد المغرب بـ90 دقيقة',
      ur: 'سعودی عرب۔ عشاء مغرب کے 90 منٹ بعد',
    }),
  },
  {
    value: 'egyptian',
    label: t({
      nb: 'Egypt',
      en: 'Egypt',
      ar: 'الهيئة المصرية',
      ur: 'مصر',
    }),
    description: t({
      nb: 'Egypt, Nord-Afrika og Levanten. Fajr 19,5°, isha 17,5°',
      en: 'Egypt, North Africa and the Levant. Fajr 19.5°, Isha 17.5°',
      ar: 'مصر وشمال أفريقيا والشام. الفجر 19.5°، العشاء 17.5°',
      ur: 'مصر، شمالی افریقہ اور شام۔ فجر 19.5°، عشاء 17.5°',
    }),
  },
  {
    value: 'karachi',
    label: t({
      nb: 'Karachi',
      en: 'Karachi',
      ar: 'كراتشي',
      ur: 'کراچی',
    }),
    description: t({
      nb: 'Sør-Asia. Fajr og isha 18°',
      en: 'South Asia. Fajr and Isha 18°',
      ar: 'جنوب آسيا. الفجر والعشاء 18°',
      ur: 'جنوبی ایشیا۔ فجر اور عشاء 18°',
    }),
  },
  {
    value: 'turkey',
    label: t({
      nb: 'Diyanet',
      en: 'Diyanet',
      ar: 'ديانت',
      ur: 'دیانت',
    }),
    description: t({
      nb: 'Tyrkia. Fajr 18°, isha 17°',
      en: 'Turkey. Fajr 18°, Isha 17°',
      ar: 'تركيا. الفجر 18°، العشاء 17°',
      ur: 'ترکی۔ فجر 18°، عشاء 17°',
    }),
  },
  {
    value: 'dubai',
    label: t({
      nb: 'Dubai',
      en: 'Dubai',
      ar: 'دبي',
      ur: 'دبئی',
    }),
    description: t({
      nb: 'De forente arabiske emirater. Fajr og isha 18,2°',
      en: 'United Arab Emirates. Fajr and Isha 18.2°',
      ar: 'الإمارات العربية المتحدة. الفجر والعشاء 18.2°',
      ur: 'متحدہ عرب امارات۔ فجر اور عشاء 18.2°',
    }),
  },
  {
    value: 'kuwait',
    label: t({
      nb: 'Kuwait',
      en: 'Kuwait',
      ar: 'الكويت',
      ur: 'کویت',
    }),
    description: t({
      nb: 'Kuwait. Fajr 18°, isha 17,5°',
      en: 'Kuwait. Fajr 18°, Isha 17.5°',
      ar: 'الكويت. الفجر 18°، العشاء 17.5°',
      ur: 'کویت۔ فجر 18°، عشاء 17.5°',
    }),
  },
  {
    value: 'qatar',
    label: t({
      nb: 'Qatar',
      en: 'Qatar',
      ar: 'قطر',
      ur: 'قطر',
    }),
    description: t({
      nb: 'Qatar. Isha 90 minutter etter maghrib',
      en: 'Qatar. Isha 90 minutes after Maghrib',
      ar: 'قطر. العشاء بعد المغرب بـ90 دقيقة',
      ur: 'قطر۔ عشاء مغرب کے 90 منٹ بعد',
    }),
  },
  {
    value: 'singapore',
    label: t({
      nb: 'Singapore',
      en: 'Singapore',
      ar: 'سنغافورة',
      ur: 'سنگاپور',
    }),
    description: t({
      nb: 'Singapore, Malaysia og Indonesia. Fajr 20°, isha 18°',
      en: 'Singapore, Malaysia and Indonesia. Fajr 20°, Isha 18°',
      ar: 'سنغافورة وماليزيا وإندونيسيا. الفجر 20°، العشاء 18°',
      ur: 'سنگاپور، ملائیشیا اور انڈونیشیا۔ فجر 20°، عشاء 18°',
    }),
  },
  {
    value: 'tehran',
    label: t({
      nb: 'Teheran',
      en: 'Tehran',
      ar: 'طهران',
      ur: 'تہران',
    }),
    description: t({
      nb: 'Iran. Fajr 17,7°, isha 14°',
      en: 'Iran. Fajr 17.7°, Isha 14°',
      ar: 'إيران. الفجر 17.7°، العشاء 14°',
      ur: 'ایران۔ فجر 17.7°، عشاء 14°',
    }),
  },
];

const COUNTRY_METHODS: Record<string, CalculationMethodKey> = {
  SA: 'umm_al_qura',
  YE: 'umm_al_qura',
  BH: 'umm_al_qura',
  OM: 'umm_al_qura',
  AE: 'dubai',
  KW: 'kuwait',
  QA: 'qatar',
  IR: 'tehran',
  TR: 'turkey',
  AZ: 'turkey',
  XK: 'turkey',
  BA: 'turkey',
  AL: 'turkey',
  MK: 'turkey',
  EG: 'egyptian',
  SD: 'egyptian',
  LY: 'egyptian',
  DZ: 'egyptian',
  TN: 'egyptian',
  MA: 'egyptian',
  IQ: 'egyptian',
  SY: 'egyptian',
  LB: 'egyptian',
  JO: 'egyptian',
  PS: 'egyptian',
  PK: 'karachi',
  IN: 'karachi',
  BD: 'karachi',
  AF: 'karachi',
  NP: 'karachi',
  LK: 'karachi',
  MV: 'karachi',
  US: 'isna',
  CA: 'isna',
  SG: 'singapore',
  MY: 'singapore',
  ID: 'singapore',
  BN: 'singapore',
};

export function calculationMethodForCountry(
  countryCode: string | null | undefined,
): CalculationMethodKey {
  if (!countryCode) return DEFAULT_CALCULATION_METHOD;
  return COUNTRY_METHODS[countryCode.toUpperCase()] ?? DEFAULT_CALCULATION_METHOD;
}

export function resolveCalculationMethod(
  chosen: CalculationMethodKey | null,
  countryCode: string | null | undefined,
): CalculationMethodKey {
  return chosen ?? calculationMethodForCountry(countryCode);
}

export function calculationMethodLabel(method: CalculationMethodKey): string {
  return CALCULATION_METHOD_OPTIONS.find((option) => option.value === method)?.label ?? method;
}
