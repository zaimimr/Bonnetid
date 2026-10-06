import { t } from './i18n.ts';

export const JUMMAH_MISSING_FOR_MOSQUE = t({
  nb: 'Vi har ingen registrert fredagstid for denne moskeen. Det betyr ikke at de ikke holder Jumuah, bare at tiden ikke er registrert hos oss.',
  en: 'We have no Friday prayer time registered for this mosque. It does not mean they do not hold Jumuah, only that the time is not registered with us.',
  ar: 'لا يوجد لدينا وقت مسجل لصلاة الجمعة في هذا المسجد. هذا لا يعني أنه لا تقام فيه الجمعة، بل إن الوقت غير مسجل لدينا فقط.',
  ur: 'اس مسجد کے لیے ہمارے پاس جمعہ کا کوئی وقت درج نہیں ہے۔ اس کا مطلب یہ نہیں کہ یہاں جمعہ نہیں ہوتا، صرف یہ کہ وقت ہمارے پاس درج نہیں ہے۔',
});

export const JUMMAH_MISSING_SHORT = t({
  nb: 'Jumuah ikke registrert',
  en: 'Jumuah not registered',
  ar: 'الجمعة غير مسجلة',
  ur: 'جمعہ درج نہیں',
});

export function jummahMissingForPlace(placeName: string): string {
  return t({
    nb: `Vi har ingen registrerte fredagstider i ${placeName}. Det betyr ikke at moskeene mangler Jumuah, bare at tiden ikke er registrert hos oss.`,
    en: `We have no Friday prayer times registered in ${placeName}. It does not mean the mosques do not hold Jumuah, only that the times are not registered with us.`,
    ar: `لا توجد لدينا أوقات مسجلة لصلاة الجمعة في ${placeName}. هذا لا يعني أن المساجد لا تقيم الجمعة، بل إن الأوقات غير مسجلة لدينا فقط.`,
    ur: `${placeName} میں ہمارے پاس جمعہ کے اوقات درج نہیں ہیں۔ اس کا مطلب یہ نہیں کہ مساجد میں جمعہ نہیں ہوتا، صرف یہ کہ اوقات ہمارے پاس درج نہیں ہیں۔`,
  });
}
