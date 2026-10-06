export const LANGUAGES = ['nb', 'en', 'ar', 'ur'] as const;
export type Language = (typeof LANGUAGES)[number];
export type Translations<T = string> = Record<Language, T>;

const ALIASES: Record<string, Language> = { nb: 'nb', no: 'nb', nn: 'nb', en: 'en', ar: 'ar', ur: 'ur' };
const RTL_LANGUAGES: readonly Language[] = ['ar', 'ur'];
const INTL_LOCALES: Translations = { nb: 'nb-NO', en: 'en-GB', ar: 'ar-u-nu-latn', ur: 'ur-PK-u-nu-latn' };
const FALLBACK: Language = 'en';

let current: Language = 'nb';

export function resolveLanguage(languageCodes: readonly (string | null | undefined)[]): Language {
  for (const code of languageCodes) {
    const match = code ? ALIASES[code.toLowerCase().split(/[-_]/)[0]] : undefined;
    if (match) return match;
  }
  return FALLBACK;
}

export function setLanguage(language: Language): void {
  current = language;
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

export function t<T>(translations: Translations<T>): T {
  return translations[current];
}
