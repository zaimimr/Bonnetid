import { useLocations, useMosque } from '@/api/queries';
import { useActiveLocation, useSettings, type AsrMethodPreference } from '@/store/settings';

export function toPreference(
  method: 'IRN' | 'SHADOW_1X' | 'SHADOW_2X' | 'WUSTA' | 'NONE' | string | null | undefined,
): AsrMethodPreference | null {
  if (method === 'IRN') return 'irn';
  if (method === 'SHADOW_1X') return 'shadow_1x';
  if (method === 'SHADOW_2X') return 'shadow_2x';
  if (method === 'WUSTA') return 'wusta';
  return null;
}

export function useMosqueAsrOverride(): AsrMethodPreference | null {
  const mosque = useSettings((state) => state.mosque);
  const location = useActiveLocation();
  const { data } = useMosque(mosque?.orgNr ?? '', { enabled: mosque != null });
  if (!mosque || !data) return null;
  if (data.location_iso !== location.iso) return null;
  return toPreference(data.asr_method);
}

export function useLocationAsrDefault(): AsrMethodPreference | null {
  const location = useActiveLocation();
  const { data } = useLocations();
  return toPreference(data?.find((entry) => entry.iso === location.iso)?.asr_method);
}

export function useEffectiveAsrMethod(): AsrMethodPreference {
  const override = useMosqueAsrOverride();
  const chosen = useSettings((state) => state.asrMethod);
  const locationDefault = useLocationAsrDefault();
  return override ?? chosen ?? locationDefault ?? 'shadow_1x';
}
