import { t } from './i18n.ts';

export type HijriMeta = {
  monthNames: Map<number, string>;
  monthStartNames: Map<number, string>;
  yearlyEvents: Map<string, string>;
};

const MONTHS: [number, string, string][] = t({
  nb: [
    [1, 'Muharram', '01. Muharram – Den første måned (Islamsk Nyttår)'],
    [2, 'Safar', '01. Safar – Den andre måned'],
    [3, 'Rabi al-Awal', '01. Rabi al-Awal – Den tredje måned'],
    [4, 'Rabi at-thani', '01. Rabi at-thani – Den fjerne måned'],
    [5, 'Jumadi al-Awwal', '01. Jumadi al-Awwal – Den femte måned'],
    [6, 'Jumadi al-Thani', '01. Jumadi al-Thani – Den sjette måned'],
    [7, 'Rajab', '01. Rajab – Den syvende måned'],
    [8, "Sha'ban", "01. Sha'ban – Den åttende måned"],
    [9, 'Ramadan', '01. Ramadan – Den niende måned (Fastemåneden)'],
    [10, 'Shawwal', '01. Shawwal - Den tiende måned - (Eid ul-Fitr)'],
    [11, 'Dhul Qa’da', '01. Dhul Qa’da – Den ellevte måned'],
    [12, 'Dhul-hijja', '01. Dhul-hijja – Den tolvte måned (Pilgrimsreisen)'],
  ],
  en: [
    [1, 'Muharram', '1 Muharram - The first month (Islamic New Year)'],
    [2, 'Safar', '1 Safar - The second month'],
    [3, 'Rabi al-Awwal', '1 Rabi al-Awwal - The third month'],
    [4, 'Rabi al-Thani', '1 Rabi al-Thani - The fourth month'],
    [5, 'Jumada al-Ula', '1 Jumada al-Ula - The fifth month'],
    [6, 'Jumada al-Akhirah', '1 Jumada al-Akhirah - The sixth month'],
    [7, 'Rajab', '1 Rajab - The seventh month'],
    [8, 'Shaban', '1 Shaban - The eighth month'],
    [9, 'Ramadan', '1 Ramadan - The ninth month (The month of fasting)'],
    [10, 'Shawwal', '1 Shawwal - The tenth month (Eid al-Fitr)'],
    [11, 'Dhul Qadah', '1 Dhul Qadah - The eleventh month'],
    [12, 'Dhul Hijjah', '1 Dhul Hijjah - The twelfth month (Hajj)'],
  ],
  ar: [
    [1, 'محرم', '1 محرم - الشهر الأول (رأس السنة الهجرية)'],
    [2, 'صفر', '1 صفر - الشهر الثاني'],
    [3, 'ربيع الأول', '1 ربيع الأول - الشهر الثالث'],
    [4, 'ربيع الآخر', '1 ربيع الآخر - الشهر الرابع'],
    [5, 'جمادى الأولى', '1 جمادى الأولى - الشهر الخامس'],
    [6, 'جمادى الآخرة', '1 جمادى الآخرة - الشهر السادس'],
    [7, 'رجب', '1 رجب - الشهر السابع'],
    [8, 'شعبان', '1 شعبان - الشهر الثامن'],
    [9, 'رمضان', '1 رمضان - الشهر التاسع (شهر الصيام)'],
    [10, 'شوال', '1 شوال - الشهر العاشر (عيد الفطر)'],
    [11, 'ذو القعدة', '1 ذو القعدة - الشهر الحادي عشر'],
    [12, 'ذو الحجة', '1 ذو الحجة - الشهر الثاني عشر (الحج)'],
  ],
  ur: [
    [1, 'محرم', '1 محرم - پہلا مہینہ (اسلامی نیا سال)'],
    [2, 'صفر', '1 صفر - دوسرا مہینہ'],
    [3, 'ربیع الاول', '1 ربیع الاول - تیسرا مہینہ'],
    [4, 'ربیع الثانی', '1 ربیع الثانی - چوتھا مہینہ'],
    [5, 'جمادی الاول', '1 جمادی الاول - پانچواں مہینہ'],
    [6, 'جمادی الثانی', '1 جمادی الثانی - چھٹا مہینہ'],
    [7, 'رجب', '1 رجب - ساتواں مہینہ'],
    [8, 'شعبان', '1 شعبان - آٹھواں مہینہ'],
    [9, 'رمضان', '1 رمضان - نواں مہینہ (روزوں کا مہینہ)'],
    [10, 'شوال', '1 شوال - دسواں مہینہ (عید الفطر)'],
    [11, 'ذوالقعدہ', '1 ذوالقعدہ - گیارہواں مہینہ'],
    [12, 'ذوالحجہ', '1 ذوالحجہ - بارہواں مہینہ (حج)'],
  ],
});

const YEARLY_EVENTS: [number, number, string][] = t({
  nb: [
    [1, 10, '10. MUHARRAM – AASHARA'],
    [3, 12, '12. Rabi al-Awal – Mawlid an-Nabi (Profetens fødselsdag)'],
    [7, 27, '27. Rajab – Shab-e-Miraj (Isra-natten)'],
    [8, 15, "15. Sha'ban – Laylat-ul-Barat (Tilgivelsesnatten)"],
    [9, 21, '21. Ramadan – Siste Ashra (3. Ashra)'],
    [9, 27, '27. Ramadan – Laylat-ul-Qadr (Skjebnenatten)'],
    [12, 9, '9. Dhul-Hijja – Arafah'],
    [12, 10, '10. Dhul-Hijja – Eid al-Adha'],
  ],
  en: [
    [1, 10, '10 Muharram - Ashura'],
    [3, 12, "12 Rabi al-Awwal - Mawlid an-Nabi (The Prophet's birthday)"],
    [7, 27, '27 Rajab - Shab-e-Miraj (Night of Isra)'],
    [8, 15, '15 Shaban - Laylat al-Baraat (Night of Forgiveness)'],
    [9, 21, '21 Ramadan - Last Ashra (3rd Ashra)'],
    [9, 27, '27 Ramadan - Laylat al-Qadr (Night of Decree)'],
    [12, 9, '9 Dhul Hijjah - Arafah'],
    [12, 10, '10 Dhul Hijjah - Eid al-Adha'],
  ],
  ar: [
    [1, 10, '10 محرم - عاشوراء'],
    [3, 12, '12 ربيع الأول - المولد النبوي'],
    [7, 27, '27 رجب - ليلة الإسراء والمعراج'],
    [8, 15, '15 شعبان - ليلة النصف من شعبان'],
    [9, 21, '21 رمضان - العشر الأواخر'],
    [9, 27, '27 رمضان - ليلة القدر'],
    [12, 9, '9 ذو الحجة - يوم عرفة'],
    [12, 10, '10 ذو الحجة - عيد الأضحى'],
  ],
  ur: [
    [1, 10, '10 محرم - عاشورہ'],
    [3, 12, '12 ربیع الاول - میلاد النبی'],
    [7, 27, '27 رجب - شب معراج'],
    [8, 15, '15 شعبان - شب برات'],
    [9, 21, '21 رمضان - آخری عشرہ'],
    [9, 27, '27 رمضان - لیلۃ القدر'],
    [12, 9, '9 ذوالحجہ - یوم عرفہ'],
    [12, 10, '10 ذوالحجہ - عید الاضحی'],
  ],
});

export const HIJRI_META: HijriMeta = {
  monthNames: new Map(MONTHS.map(([month, nameLong]) => [month, nameLong])),
  monthStartNames: new Map(MONTHS.map(([month, , no]) => [month, no])),
  yearlyEvents: new Map(YEARLY_EVENTS.map(([month, day, no]) => [`${month}-${day}`, no])),
};
