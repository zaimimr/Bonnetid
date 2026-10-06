import type { AsrMethodPreference } from '@/store/settings';
import { t } from './i18n.ts';

export type AsrMethodOption = {
  value: AsrMethodPreference;
  label: string;
  description: string;
};

export const ASR_METHOD_OPTIONS: AsrMethodOption[] = [
  {
    value: 'irn',
    label: t('prayer.irnStandard'),
    description: t('prayer.theStandardMethodFrom'),
  },
  {
    value: 'shadow_1x',
    label: t('prayer.n1xShadow'),
    description: t('prayer.otherSchoolsOfLaw'),
  },
  {
    value: 'shadow_2x',
    label: t('prayer.n2xShadow'),
    description: t('prayer.hanafi'),
  },
  {
    value: 'wusta',
    label: t('prayer.wusta'),
    description: t('prayer.midpointBetweenSolarNoon'),
  },
];

export function asrMethodLabel(method: AsrMethodPreference): string {
  return ASR_METHOD_OPTIONS.find((option) => option.value === method)?.label ?? method;
}
