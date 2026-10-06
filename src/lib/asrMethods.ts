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
    label: t({ nb: 'IRN standard', en: 'IRN standard', ar: 'معيار المجلس الإسلامي', ur: 'IRN معیاری' }),
    description: t({
      nb: 'Standardmetoden fra IRN',
      en: 'The standard method from IRN',
      ar: 'الطريقة المعتمدة لدى المجلس الإسلامي النرويجي',
      ur: 'اسلامک کونسل ناروے کا معیاری طریقہ',
    }),
  },
  {
    value: 'shadow_1x',
    label: t({ nb: '1x skygge', en: '1x shadow', ar: 'مثل الظل', ur: 'ایک مثل' }),
    description: t({ nb: 'Øvrige lovskoler', en: 'Other schools of law', ar: 'المذاهب الأخرى', ur: 'دیگر مکاتب فکر' }),
  },
  {
    value: 'shadow_2x',
    label: t({ nb: '2x skygge', en: '2x shadow', ar: 'مثلا الظل', ur: 'دو مثل' }),
    description: t({ nb: 'Hanafi', en: 'Hanafi', ar: 'الحنفي', ur: 'حنفی' }),
  },
  {
    value: 'wusta',
    label: t({ nb: 'Wusta', en: 'Wusta', ar: 'الوسطى', ur: 'وسطیٰ' }),
    description: t({
      nb: 'Midtpunkt mellom soltider og solnedgang',
      en: 'Midpoint between solar noon and sunset',
      ar: 'منتصف الوقت بين الزوال والغروب',
      ur: 'زوال اور غروب آفتاب کا درمیانی وقت',
    }),
  },
];

export function asrMethodLabel(method: AsrMethodPreference): string {
  return ASR_METHOD_OPTIONS.find((option) => option.value === method)?.label ?? method;
}
