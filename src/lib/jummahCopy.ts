import { t } from './i18n.ts';

export const JUMMAH_MISSING_FOR_MOSQUE = t('prayer.weHaveNoFriday');

export const JUMMAH_MISSING_SHORT = t('prayer.jumuahNotRegistered');

export function jummahMissingForPlace(placeName: string): string {
  return t('prayer.weHaveNoFriday2', { placeName });
}
