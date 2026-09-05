export type CalculationMethodKey = 'mwl' | 'isna' | 'umm_al_qura' | 'karachi' | 'egyptian';

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
    value: 'karachi',
    label: 'Karachi',
    description: 'Sør-Asia. Fajr og isha 18°',
  },
  {
    value: 'egyptian',
    label: 'Egypt',
    description: 'Egypt og deler av Afrika. Fajr 19,5°, isha 17,5°',
  },
];

export function calculationMethodLabel(method: CalculationMethodKey): string {
  return CALCULATION_METHOD_OPTIONS.find((option) => option.value === method)?.label ?? method;
}
