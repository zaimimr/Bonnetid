import { useMosque } from '@/api/queries';
import {
  useActiveLocation,
  useActiveMosque,
  useSettings,
  type AsrMethodPreference,
} from '@/store/settings';

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
  const mosque = useActiveMosque();
  const location = useActiveLocation();
  const { data } = useMosque(mosque?.orgNr ?? '', { enabled: mosque != null });
  if (!mosque || !data) return null;
  if (data.location_iso !== location.iso) return null;
  return toPreference(data.asr_method);
}

export function useEffectiveAsrMethod(): AsrMethodPreference {
  const override = useMosqueAsrOverride();
  const chosen = useSettings((state) => state.asrMethod);
  return override ?? chosen ?? 'irn';
}
