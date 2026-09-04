import type { AsrMethodPreference } from '@/store/settings';

export type AsrMethodOption = {
  value: AsrMethodPreference;
  label: string;
  description: string;
};

export const ASR_METHOD_OPTIONS: AsrMethodOption[] = [
  { value: 'irn', label: 'IRN standard', description: 'Standardmetoden fra IRN' },
  { value: 'shadow_1x', label: '1x skygge', description: 'Øvrige lovskoler' },
  { value: 'shadow_2x', label: '2x skygge', description: 'Hanafi' },
  { value: 'wusta', label: 'Wusta', description: 'Midtpunkt mellom soltider og solnedgang' },
];

export function asrMethodLabel(method: AsrMethodPreference): string {
  return ASR_METHOD_OPTIONS.find((option) => option.value === method)?.label ?? method;
}
