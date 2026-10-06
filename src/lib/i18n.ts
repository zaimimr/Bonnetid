import { changeLanguage, init, t, type ParseKeys } from 'i18next';
import { resources } from '../i18n/resources.ts';

export const LANGUAGES = ['nb', 'en', 'ar', 'ur'] as const;
export type Language = (typeof LANGUAGES)[number];

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: (typeof resources)['nb'];
  }
}

const ALIASES: Record<string, Language> = { nb: 'nb', no: 'nb', nn: 'nb', en: 'en', ar: 'ar', ur: 'ur' };
const RTL_LANGUAGES: readonly Language[] = ['ar', 'ur'];
const INTL_LOCALES: Record<Language, string> = { nb: 'nb-NO', en: 'en-GB', ar: 'ar-u-nu-latn', ur: 'ur-PK-u-nu-latn' };
const FALLBACK: Language = 'en';

let current: Language = 'nb';

init({
  resources,
  lng: current,
  fallbackLng: FALLBACK,
  initAsync: false,
  interpolation: { escapeValue: false },
});

export { t };

type CountKey = ParseKeys extends infer K ? (K extends `${infer Base}_other` ? Base : never) : never;
type PluralCategory = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';

function pluralCategory(count: number): PluralCategory {
  if (current !== 'ar') return count === 1 ? 'one' : 'other';
  const rest = count % 100;
  if (count === 0) return 'zero';
  if (count === 1) return 'one';
  if (count === 2) return 'two';
  if (rest >= 3 && rest <= 10) return 'few';
  if (rest >= 11) return 'many';
  return 'other';
}

export function tCount(key: CountKey, count: number): string {
  return t([`${key}_${pluralCategory(count)}`, `${key}_other`] as unknown as ParseKeys, { count });
}

export function resolveLanguage(languageCodes: readonly (string | null | undefined)[]): Language {
  for (const code of languageCodes) {
    const match = code ? ALIASES[code.toLowerCase().split(/[-_]/)[0]] : undefined;
    if (match) return match;
  }
  return FALLBACK;
}

export function setLanguage(language: Language): void {
  current = language;
  changeLanguage(language);
}

export function language(): Language {
  return current;
}

export function isRTL(): boolean {
  return RTL_LANGUAGES.includes(current);
}

export function intlLocale(): string {
  return INTL_LOCALES[current];
}
