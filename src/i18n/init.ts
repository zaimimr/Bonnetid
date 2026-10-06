import { getLocales } from 'expo-localization';
import { resolveLanguage, setLanguage } from '@/lib/i18n';

setLanguage(resolveLanguage(getLocales().map((locale) => locale.languageCode)));
