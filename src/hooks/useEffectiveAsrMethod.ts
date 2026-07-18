import { useLocations, useMosque } from '@/api/queries';
import { useActiveLocation, useSettings, type AsrMethodPreference } from '@/store/settings';

function toPreference(method: 'SHADOW_1X' | 'SHADOW_2X' | string | null | undefined): AsrMethodPreference | null {
  if (method === 'SHADOW_1X') return 'shadow_1x';
  if (method === 'SHADOW_2X') return 'shadow_2x';
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
