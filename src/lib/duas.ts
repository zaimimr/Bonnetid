import { t } from './i18n.ts';
import type { PrayerLog } from './prayerLog';

export type DuaCategoryId =
  | 'after-adhan'
  | 'wudu-mosque'
  | 'after-salah'
  | 'ramadan'
  | 'eid'
  | 'hajj';

export type DuaSeason = 'ramadan' | 'eid' | 'dhul-hijjah';

export type DuaCategory = {
  id: DuaCategoryId;
  title: string;
  description: string;
  season?: DuaSeason;
};

export type Dua = {
  id: string;
  category: DuaCategoryId;
  title: string;
  arabic: string;
  transliteration: string;
  meaning: string;
  source: string;
  repeat?: number;
  note?: string;
};

export const DUA_CATEGORIES: DuaCategory[] = [
  {
    id: 'after-adhan',
    title: t('duas.afterAdhan.title'),
    description: t('duas.afterAdhan.description'),
  },
  {
    id: 'wudu-mosque',
    title: t('duas.wuduMosque.title'),
    description: t('duas.wuduMosque.description'),
  },
  {
    id: 'after-salah',
    title: t('duas.afterSalah.title'),
    description: t('duas.afterSalah.description'),
  },
  {
    id: 'ramadan',
    title: t('duas.ramadan.title'),
    description: t('duas.ramadan.description'),
    season: 'ramadan',
  },
  {
    id: 'eid',
    title: t('duas.eid.title'),
    description: t('duas.eid.description'),
    season: 'eid',
  },
  {
    id: 'hajj',
    title: t('duas.hajj.title'),
    description: t('duas.hajj.description'),
    season: 'dhul-hijjah',
  },
];

export const DUA_LINKS = {
  hajj: 'hajj',
  iftar: 'iftar',
  laylatAlQadr: 'laylat-al-qadr',
  tasbih: 'tasbih',
} as const;

export const DUAS: Dua[] = [
  {
    id: 'answer-muezzin',
    category: 'after-adhan',
    title: t('duas.answerMuezzin.title'),
    arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    transliteration: 'La hawla wa la quwwata illa billah',
    meaning: t('duas.answerMuezzin.meaning'),
    note: t('duas.answerMuezzin.note'),
    source: 'Sahih al-Bukhari 611, Sahih Muslim 385',
  },
  {
    id: 'testimony-after-adhan',
    category: 'after-adhan',
    title: t('duas.testimonyAfterAdhan.title'),
    arabic:
      'أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، وَأَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ، رَضِيتُ بِاللَّهِ رَبًّا، وَبِمُحَمَّدٍ رَسُولًا، وَبِالْإِسْلَامِ دِينًا',
    transliteration:
      "Ashhadu an la ilaha illallahu wahdahu la sharika lah, wa anna Muhammadan 'abduhu wa rasuluh, raditu billahi rabban, wa bi-Muhammadin rasulan, wa bil-islami dina",
    meaning: t('duas.testimonyAfterAdhan.meaning'),
    source: 'Sahih Muslim 386',
  },
  {
    id: 'adhan-dua',
    category: 'after-adhan',
    title: t('duas.adhanDua.title'),
    arabic:
      'اللَّهُمَّ رَبَّ هَٰذِهِ الدَّعْوَةِ التَّامَّةِ، وَالصَّلَاةِ الْقَائِمَةِ، آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ، وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ',
    transliteration:
      "Allahumma rabba hadhihid-da'watit-tammah, was-salatil-qa'imah, ati Muhammadanil-wasilata wal-fadilah, wab'athhu maqamam mahmudanil-ladhi wa'adtah",
    meaning: t('duas.adhanDua.meaning'),
    source: 'Sahih al-Bukhari 614',
  },
  {
    id: 'after-wudu',
    category: 'wudu-mosque',
    title: t('duas.afterWudu.title'),
    arabic:
      'أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ',
    transliteration:
      "Ashhadu an la ilaha illallahu wahdahu la sharika lah, wa ashhadu anna Muhammadan 'abduhu wa rasuluh",
    meaning: t('duas.afterWudu.meaning'),
    source: 'Sahih Muslim 234',
  },
  {
    id: 'entering-mosque',
    category: 'wudu-mosque',
    title: t('duas.enteringMosque.title'),
    arabic: 'اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ',
    transliteration: 'Allahummaf-tah li abwaba rahmatik',
    meaning: t('duas.enteringMosque.meaning'),
    source: 'Sahih Muslim 713',
  },
  {
    id: 'leaving-mosque',
    category: 'wudu-mosque',
    title: t('duas.leavingMosque.title'),
    arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ',
    transliteration: "Allahumma inni as'aluka min fadlik",
    meaning: t('duas.leavingMosque.meaning'),
    source: 'Sahih Muslim 713',
  },
  {
    id: 'istighfar',
    category: 'after-salah',
    title: t('duas.istighfar.title'),
    arabic: 'أَسْتَغْفِرُ اللَّهَ',
    transliteration: 'Astaghfirullah',
    meaning: t('duas.istighfar.meaning'),
    repeat: 3,
    source: 'Sahih Muslim 591',
  },
  {
    id: 'anta-as-salam',
    category: 'after-salah',
    title: t('duas.antaAsSalam.title'),
    arabic: 'اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ',
    transliteration: 'Allahumma antas-salam wa minkas-salam, tabarakta ya dhal-jalali wal-ikram',
    meaning: t('duas.antaAsSalam.meaning'),
    source: 'Sahih Muslim 591',
  },
  {
    id: 'la-ilaha-illallah-after-salah',
    category: 'after-salah',
    title: t('duas.laIlahaIllallahAfter.title'),
    arabic:
      'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ، اللَّهُمَّ لَا مَانِعَ لِمَا أَعْطَيْتَ، وَلَا مُعْطِيَ لِمَا مَنَعْتَ، وَلَا يَنْفَعُ ذَا الْجَدِّ مِنْكَ الْجَدُّ',
    transliteration:
      "La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamdu wa huwa 'ala kulli shay'in qadir. Allahumma la mani'a lima a'tayta, wa la mu'tiya lima mana'ta, wa la yanfa'u dhal-jaddi minkal-jadd",
    meaning: t('duas.laIlahaIllallahAfter.meaning'),
    source: 'Sahih al-Bukhari 844, Sahih Muslim 593',
  },
  {
    id: 'tasbih',
    category: 'after-salah',
    title: t('duas.tasbih2.title'),
    arabic: 'سُبْحَانَ اللَّهِ\nالْحَمْدُ لِلَّهِ\nاللَّهُ أَكْبَرُ',
    transliteration: 'Subhanallah\nAlhamdulillah\nAllahu akbar',
    meaning: t('duas.tasbih2.meaning'),
    note: t('duas.tasbih2.note'),
    repeat: 33,
    source: 'Sahih Muslim 597',
  },
  {
    id: 'tasbih-completion',
    category: 'after-salah',
    title: t('duas.tasbihCompletion.title'),
    arabic:
      'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
    transliteration:
      "La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamdu wa huwa 'ala kulli shay'in qadir",
    meaning: t('duas.tasbihCompletion.meaning'),
    note: t('duas.tasbihCompletion.note'),
    source: 'Sahih Muslim 597',
  },
  {
    id: 'ayat-al-kursi',
    category: 'after-salah',
    title: t('duas.ayatAlKursi.title'),
    arabic:
      'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ',
    transliteration:
      "Allahu la ilaha illa huwal-hayyul-qayyum. La ta'khudhuhu sinatun wa la nawm. Lahu ma fis-samawati wa ma fil-ard. Man dhal-ladhi yashfa'u 'indahu illa bi-idhnih. Ya'lamu ma bayna aydihim wa ma khalfahum, wa la yuhituna bi-shay'im-min 'ilmihi illa bima sha'. Wasi'a kursiyyuhus-samawati wal-ard, wa la ya'uduhu hifzuhuma, wa huwal-'aliyyul-'azim",
    meaning: t('duas.ayatAlKursi.meaning'),
    source: t('duas.ayatAlKursi.source'),
  },
  {
    id: 'muawwidhat',
    category: 'after-salah',
    title: t('duas.muawwidhat.title'),
    arabic:
      'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\nقُلْ هُوَ اللَّهُ أَحَدٌ ﴿١﴾ اللَّهُ الصَّمَدُ ﴿٢﴾ لَمْ يَلِدْ وَلَمْ يُولَدْ ﴿٣﴾ وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ ﴿٤﴾\n\nبِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\nقُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ﴿١﴾ مِنْ شَرِّ مَا خَلَقَ ﴿٢﴾ وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ ﴿٣﴾ وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ﴿٤﴾ وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ ﴿٥﴾\n\nبِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\nقُلْ أَعُوذُ بِرَبِّ النَّاسِ ﴿١﴾ مَلِكِ النَّاسِ ﴿٢﴾ إِلَٰهِ النَّاسِ ﴿٣﴾ مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ﴿٤﴾ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ﴿٥﴾ مِنَ الْجِنَّةِ وَالنَّاسِ ﴿٦﴾',
    transliteration:
      "Qul huwallahu ahad. Allahus-samad. Lam yalid wa lam yulad. Wa lam yakul-lahu kufuwan ahad.\n\nQul a'udhu bi-rabbil-falaq. Min sharri ma khalaq. Wa min sharri ghasiqin idha waqab. Wa min sharrin-naffathati fil-'uqad. Wa min sharri hasidin idha hasad.\n\nQul a'udhu bi-rabbin-nas. Malikin-nas. Ilahin-nas. Min sharril-waswasil-khannas. Alladhi yuwaswisu fi sudurin-nas. Minal-jinnati wan-nas.",
    meaning: t('duas.muawwidhat.meaning'),
    note: t('duas.muawwidhat.note'),
    source: t('duas.muawwidhat.source'),
  },
  {
    id: 'help-me-remember',
    category: 'after-salah',
    title: t('duas.helpMeRemember.title'),
    arabic: 'اللَّهُمَّ أَعِنِّي عَلَىٰ ذِكْرِكَ، وَشُكْرِكَ، وَحُسْنِ عِبَادَتِكَ',
    transliteration: "Allahumma a'inni 'ala dhikrika, wa shukrika, wa husni 'ibadatik",
    meaning: t('duas.helpMeRemember.meaning'),
    source: 'Sunan Abi Dawud 1522',
  },
  {
    id: 'iftar',
    category: 'ramadan',
    title: t('duas.iftar.title'),
    arabic: 'ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ وَثَبَتَ الْأَجْرُ إِنْ شَاءَ اللَّهُ',
    transliteration: "Dhahabaz-zama'u wabtallatil-'uruqu wa thabatal-ajru in sha' Allah",
    meaning: t('duas.iftar.meaning'),
    note: t('duas.iftar.note'),
    source: 'Sunan Abi Dawud 2357',
  },
  {
    id: 'laylat-al-qadr',
    category: 'ramadan',
    title: t('duas.laylatAlQadr.title'),
    arabic: 'اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي',
    transliteration: "Allahumma innaka 'afuwwun tuhibbul-'afwa fa'fu 'anni",
    meaning: t('duas.laylatAlQadr.meaning'),
    note: t('duas.laylatAlQadr.note'),
    source: "Jami' at-Tirmidhi 3513, Sunan Ibn Majah 3850",
  },
  {
    id: 'i-am-fasting',
    category: 'ramadan',
    title: t('duas.iAmFasting.title'),
    arabic: 'إِنِّي صَائِمٌ',
    transliteration: "Inni sa'im",
    meaning: t('duas.iAmFasting.meaning'),
    note: t('duas.iAmFasting.note'),
    source: 'Sahih al-Bukhari 1904',
  },
  {
    id: 'iftar-as-guest',
    category: 'ramadan',
    title: t('duas.iftarAsGuest.title'),
    arabic:
      'أَفْطَرَ عِنْدَكُمُ الصَّائِمُونَ، وَأَكَلَ طَعَامَكُمُ الْأَبْرَارُ، وَصَلَّتْ عَلَيْكُمُ الْمَلَائِكَةُ',
    transliteration:
      "Aftara 'indakumus-sa'imun, wa akala ta'amakumul-abrar, wa sallat 'alaykumul-mala'ikah",
    meaning: t('duas.iftarAsGuest.meaning'),
    source: 'Sunan Abi Dawud 3854',
  },
  {
    id: 'talbiyah',
    category: 'hajj',
    title: t('duas.talbiyah.title'),
    arabic:
      'لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيكَ لَكَ',
    transliteration:
      "Labbayk Allahumma labbayk, labbayka la sharika laka labbayk, innal-hamda wan-ni'mata laka wal-mulk, la sharika lak",
    meaning: t('duas.talbiyah.meaning'),
    note: t('duas.talbiyah.note'),
    source: 'Sahih al-Bukhari 1549, Sahih Muslim 1184',
  },
  {
    id: 'arafah',
    category: 'hajj',
    title: t('duas.arafah.title'),
    arabic:
      'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
    transliteration:
      "La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamd, wa huwa 'ala kulli shay'in qadir",
    meaning: t('duas.arafah.meaning'),
    note: t('duas.arafah.note'),
    source: "Jami' at-Tirmidhi 3585",
  },
  {
    id: 'takbir-dhul-hijjah',
    category: 'hajj',
    title: t('duas.takbirDhulHijjah.title'),
    arabic:
      'اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، لَا إِلَٰهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، وَلِلَّهِ الْحَمْدُ',
    transliteration: 'Allahu akbar, Allahu akbar, la ilaha illallah, wallahu akbar, Allahu akbar, wa lillahil-hamd',
    meaning: t('duas.takbirDhulHijjah.meaning'),
    note: t('duas.takbirDhulHijjah.note'),
    source: t('duas.takbirDhulHijjah.source'),
  },
  {
    id: 'between-the-corners',
    category: 'hajj',
    title: t('duas.betweenTheCorners.title'),
    arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
    transliteration: "Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina 'adhaban-nar",
    meaning: t('duas.betweenTheCorners.meaning'),
    note: t('duas.betweenTheCorners.note'),
    source: t('duas.betweenTheCorners.source'),
  },
  {
    id: 'qurbani',
    category: 'hajj',
    title: t('duas.qurbani.title'),
    arabic: 'بِسْمِ اللَّهِ وَاللَّهُ أَكْبَرُ',
    transliteration: 'Bismillahi wallahu akbar',
    meaning: t('duas.qurbani.meaning'),
    source: 'Sahih Muslim 1966',
  },
  {
    id: 'takbir-eid',
    category: 'eid',
    title: t('duas.takbirEid.title'),
    arabic:
      'اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، لَا إِلَٰهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، وَلِلَّهِ الْحَمْدُ',
    transliteration: 'Allahu akbar, Allahu akbar, la ilaha illallah, wallahu akbar, Allahu akbar, wa lillahil-hamd',
    meaning: t('duas.takbirEid.meaning'),
    note: t('duas.takbirEid.note'),
    source: t('duas.takbirEid.source'),
  },
  {
    id: 'eid-greeting',
    category: 'eid',
    title: t('duas.eidGreeting.title'),
    arabic: 'تَقَبَّلَ اللَّهُ مِنَّا وَمِنْكُمْ',
    transliteration: 'Taqabbalallahu minna wa minkum',
    meaning: t('duas.eidGreeting.meaning'),
    note: t('duas.eidGreeting.note'),
    source: t('duas.eidGreeting.source'),
  },
];

const FALLBACK_JAMAT_MS = 5 * 60 * 1000;
const AFTER_SALAH_MS = 20 * 60 * 1000;

export function duaCategoryForNow({
  eid,
  sinceAdhanMs,
  jamatAfterAdhanMs,
  atMosque,
  activeSeason,
}: {
  eid: boolean;
  sinceAdhanMs: number | null;
  jamatAfterAdhanMs: number | null;
  atMosque: boolean;
  activeSeason: 'ramadan' | 'dhul-hijjah' | null;
}): DuaCategoryId | null {
  if (eid) return 'eid';
  if (atMosque) {
    const jamatMs =
      jamatAfterAdhanMs != null && jamatAfterAdhanMs > 0 ? jamatAfterAdhanMs : FALLBACK_JAMAT_MS;
    if (sinceAdhanMs != null && sinceAdhanMs >= 0 && sinceAdhanMs < jamatMs) {
      return 'after-adhan';
    }
    if (sinceAdhanMs != null && sinceAdhanMs >= 0 && sinceAdhanMs < jamatMs + AFTER_SALAH_MS) {
      return 'after-salah';
    }
    return 'wudu-mosque';
  }
  if (activeSeason === 'ramadan') return 'ramadan';
  if (activeSeason === 'dhul-hijjah') return 'hajj';
  return null;
}

export function duasIn(category: DuaCategoryId): Dua[] {
  return DUAS.filter((dua) => dua.category === category);
}

export function duaById(id: string): Dua | null {
  return DUAS.find((dua) => dua.id === id) ?? null;
}

export function categoryById(id: string): DuaCategory | null {
  return DUA_CATEGORIES.find((category) => category.id === id) ?? null;
}

export const AFTER_PRAYER_WINDOW_MS = 10 * 60_000;

export function prayedRecently(log: PrayerLog, now: number): boolean {
  return Object.values(log).some(
    (entry) => entry.status === 'prayed' && entry.at <= now && now - entry.at < AFTER_PRAYER_WINDOW_MS,
  );
}
