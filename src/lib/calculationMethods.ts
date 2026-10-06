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
    label: t('prayer.muslimWorldLeague'),
    description: t('prayer.mostCommonInEurope'),
  },
  {
    value: 'isna',
    label: t('prayer.isna'),
    description: t('prayer.northAmericaLaterFajr'),
  },
  {
    value: 'umm_al_qura',
    label: t('prayer.ummAlQura'),
    description: t('prayer.saudiArabiaIsha90'),
  },
  {
    value: 'egyptian',
    label: t('prayer.egypt'),
    description: t('prayer.egyptNorthAfricaAnd'),
  },
  {
    value: 'karachi',
    label: t('prayer.karachi'),
    description: t('prayer.southAsiaFajrAnd'),
  },
  {
    value: 'turkey',
    label: t('prayer.diyanet'),
    description: t('prayer.turkeyFajr18Isha'),
  },
  {
    value: 'dubai',
    label: t('prayer.dubai'),
    description: t('prayer.unitedArabEmiratesFajr'),
  },
  {
    value: 'kuwait',
    label: t('prayer.kuwait'),
    description: t('prayer.kuwaitFajr18Isha'),
  },
  {
    value: 'qatar',
    label: t('prayer.qatar'),
    description: t('prayer.qatarIsha90Minutes'),
  },
  {
    value: 'singapore',
    label: t('prayer.singapore'),
    description: t('prayer.singaporeMalaysiaAndIndonesia'),
  },
  {
    value: 'tehran',
    label: t('prayer.tehran'),
    description: t('prayer.iranFajr177'),
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
