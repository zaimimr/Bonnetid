import {
  calculationMethodForCountry,
  resolveCalculationMethod,
  type CalculationMethodKey,
} from '@/lib/calculationMethods';
import { useActiveLocation, useSettings, type SavedLocation } from '@/store/settings';

export function useAutoCalculationMethod(location?: SavedLocation): CalculationMethodKey {
  const active = useActiveLocation();
  return calculationMethodForCountry((location ?? active).countryCode);
}

export function useEffectiveCalculationMethod(location?: SavedLocation): CalculationMethodKey {
  const active = useActiveLocation();
  const chosen = useSettings((state) => state.calculationMethod);
  return resolveCalculationMethod(chosen, (location ?? active).countryCode);
}
