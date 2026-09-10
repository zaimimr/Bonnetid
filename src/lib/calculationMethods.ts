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
    label: 'Muslim World League',
    description: 'Vanligst i Europa. Fajr 18°, isha 17°',
  },
  {
    value: 'isna',
    label: 'ISNA',
    description: 'Nord-Amerika. Senere fajr og tidligere isha, 15°',
  },
  {
    value: 'umm_al_qura',
    label: 'Umm al-Qura',
    description: 'Saudi-Arabia. Isha 90 minutter etter maghrib',
  },
  {
    value: 'egyptian',
    label: 'Egypt',
    description: 'Egypt, Nord-Afrika og Levanten. Fajr 19,5°, isha 17,5°',
  },
  {
    value: 'karachi',
    label: 'Karachi',
    description: 'Sør-Asia. Fajr og isha 18°',
  },
  {
    value: 'turkey',
    label: 'Diyanet',
    description: 'Tyrkia. Fajr 18°, isha 17°',
  },
  {
    value: 'dubai',
    label: 'Dubai',
    description: 'De forente arabiske emirater. Fajr og isha 18,2°',
  },
  {
    value: 'kuwait',
    label: 'Kuwait',
    description: 'Kuwait. Fajr 18°, isha 17,5°',
  },
  {
    value: 'qatar',
    label: 'Qatar',
    description: 'Qatar. Isha 90 minutter etter maghrib',
  },
  {
    value: 'singapore',
    label: 'Singapore',
    description: 'Singapore, Malaysia og Indonesia. Fajr 20°, isha 18°',
  },
  {
    value: 'tehran',
    label: 'Teheran',
    description: 'Iran. Fajr 17,7°, isha 14°',
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
