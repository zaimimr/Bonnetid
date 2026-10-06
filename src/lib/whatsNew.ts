import type { FeatureFlag } from './featureFlags.ts';
import { t } from './i18n.ts';

export type WhatsNewItem = {
  title: string;
  body: string;
  icon: string;
  route?: string;
  flag?: FeatureFlag;
  platform?: 'ios' | 'android';
};

export type WhatsNewEntry = {
  version: string;
  items: WhatsNewItem[];
};

export const WHATS_NEW: WhatsNewEntry[] = [
  {
    version: '1.9.0',
    items: [
      {
        title: 'Siri',
        body: t({
          nb: 'Spør Siri «Når er neste bønn?» eller be om dagens bønnetider.',
          en: 'Ask Siri «Når er neste bønn?» in Norwegian to hear the next prayer.',
          ar: 'اسأل Siri بالنرويجية \u2066«Når er neste bønn?»\u2069 لمعرفة الصلاة التالية.',
          ur: 'اگلی نماز جاننے کے لیے Siri سے نارویجن میں پوچھیں \u2066«Når er neste bønn?»\u2069',
        }),
        icon: 'mic-outline',
        platform: 'ios',
      },
      {
        title: 'Apple Watch',
        body: t({
          nb: 'Neste bønn og dagens tider på klokka, med komplikasjoner til urskiven.',
          en: 'The next prayer and today\'s times on your watch, with watch face complications.',
          ar: 'الصلاة التالية ومواقيت اليوم على ساعتك، مع إضافات لواجهة الساعة.',
          ur: 'اگلی نماز اور آج کے اوقات آپ کی گھڑی پر، واچ فیس کمپلیکیشنز کے ساتھ۔',
        }),
        icon: 'watch-outline',
        platform: 'ios',
      },
      {
        title: 'CarPlay',
        body: t({
          nb: 'Se neste bønn, dagens tider og moskeer i nærheten i bilen.',
          en: 'See the next prayer, today\'s times and nearby mosques in the car.',
          ar: 'اعرض الصلاة التالية ومواقيت اليوم والمساجد القريبة في السيارة.',
          ur: 'گاڑی میں اگلی نماز، آج کے اوقات اور قریبی مساجد دیکھیں۔',
        }),
        icon: 'car-outline',
        platform: 'ios',
      },
      {
        title: t({ nb: 'Snarveier', en: 'Shortcuts', ar: 'الاختصارات', ur: 'شارٹ کٹس' }),
        body: t({
          nb: 'Hold inne app-ikonet for neste bønn, Qibla og kalenderen.',
          en: 'Press and hold the app icon for the next prayer, Qibla and the calendar.',
          ar: 'اضغط مطولًا على أيقونة التطبيق للوصول إلى الصلاة التالية والقبلة والتقويم.',
          ur: 'اگلی نماز، قبلہ اور کیلنڈر کے لیے ایپ آئیکن کو دبا کر رکھیں۔',
        }),
        icon: 'flash-outline',
        platform: 'android',
      },
      {
        title: 'Wear OS',
        body: t({
          nb: 'Neste bønn og dagens tider på klokka, med flis og komplikasjon.',
          en: 'The next prayer and today\'s times on your watch, with a tile and complication.',
          ar: 'الصلاة التالية ومواقيت اليوم على ساعتك، مع بطاقة وإضافة لواجهة الساعة.',
          ur: 'اگلی نماز اور آج کے اوقات آپ کی گھڑی پر، ٹائل اور کمپلیکیشن کے ساتھ۔',
        }),
        icon: 'watch-outline',
        platform: 'android',
      },
      {
        title: t({ nb: 'Dua og dhikr', en: 'Dua and dhikr', ar: 'الأدعية والأذكار', ur: 'دعا اور ذکر' }),
        body: t({
          nb: 'Duaer til bønnen, Ramadan og Hajj, med uttale og oversettelse.',
          en: 'Duas for prayer, Ramadan and Hajj, with transliteration and translation.',
          ar: 'أدعية للصلاة ورمضان والحج.',
          ur: 'نماز، رمضان اور حج کی دعائیں، ترجمے کے ساتھ۔',
        }),
        icon: 'book-outline',
        route: '/duas',
        flag: 'duas',
      },
      {
        title: t({ nb: 'Tasbih', en: 'Tasbih', ar: 'المسبحة', ur: 'تسبیح' }),
        body: t({
          nb: 'Tell dhikr etter bønnen med en perlering.',
          en: 'Count dhikr after prayer with prayer beads.',
          ar: 'عُدّ أذكارك بعد الصلاة بالمسبحة.',
          ur: 'نماز کے بعد تسبیح پر ذکر گنیں۔',
        }),
        icon: 'tasbih',
        route: '/tasbih',
        flag: 'tasbih',
      },
      {
        title: t({ nb: 'Hijri-kalender', en: 'Hijri calendar', ar: 'التقويم الهجري', ur: 'ہجری کیلنڈر' }),
        body: t({
          nb: 'Kalenderen kan vise hijri som hovedkalender, og bønnetider for andre steder.',
          en: 'The calendar can show Hijri as the main calendar, and prayer times for other places.',
          ar: 'يمكن للتقويم عرض التاريخ الهجري كتقويم رئيسي، ومواقيت الصلاة لأماكن أخرى.',
          ur: 'کیلنڈر ہجری کو بنیادی کیلنڈر کے طور پر اور دیگر مقامات کے نماز کے اوقات دکھا سکتا ہے۔',
        }),
        icon: 'calendar-outline',
        route: '/calendar',
      },
      {
        title: t({
          nb: 'Flere tider på dagsiden',
          en: 'More times on the day page',
          ar: 'أوقات إضافية في صفحة اليوم',
          ur: 'دن کے صفحے پر مزید اوقات',
        }),
        body: t({
          nb: 'Se Duha, midnatt og Tahajjud for hver dag.',
          en: 'See Duha, midnight and Tahajjud for every day.',
          ar: 'اعرض أوقات الضحى ومنتصف الليل والتهجد لكل يوم.',
          ur: 'ہر دن کے لیے چاشت، آدھی رات اور تہجد کے اوقات دیکھیں۔',
        }),
        icon: 'time-outline',
      },
      {
        title: t({
          nb: 'Gi oss tilbakemelding',
          en: 'Give us feedback',
          ar: 'شاركنا رأيك',
          ur: 'ہمیں اپنی رائے دیں',
        }),
        body: t({
          nb: 'Skriv til oss rett fra appen under Mer. Vi svarer i appen.',
          en: 'Write to us right from the app under More. We reply in the app.',
          ar: 'راسلنا مباشرة من التطبيق في قسم المزيد. نرد عليك داخل التطبيق.',
          ur: 'ایپ میں مزید کے تحت ہمیں براہ راست لکھیں۔ ہم ایپ میں جواب دیتے ہیں۔',
        }),
        icon: 'chatbubble-ellipses-outline',
        route: '/feedback',
      },
    ],
  },
];

export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export function pendingWhatsNew(
  entries: WhatsNewEntry[],
  lastSeen: string | null,
  current: string,
): WhatsNewEntry[] {
  if (lastSeen == null) return [];
  return entries.filter(
    (entry) => compareVersions(entry.version, lastSeen) > 0 && compareVersions(entry.version, current) <= 0,
  );
}

export function visibleItems(
  items: WhatsNewItem[],
  isEnabled: (flag: FeatureFlag) => boolean,
  platform: string,
): WhatsNewItem[] {
  return items.filter(
    (item) => (item.flag == null || isEnabled(item.flag)) && (item.platform == null || item.platform === platform),
  );
}
