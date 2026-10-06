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
    title: t({
      nb: 'Etter adhan',
      en: 'After the adhan',
      ar: 'بعد الأذان',
      ur: 'اذان کے بعد',
    }),
    description: t({
      nb: 'Svar på kallet og duaen etterpå',
      en: 'Answering the call and the dua after it',
      ar: 'إجابة المؤذن والدعاء بعده',
      ur: 'اذان کا جواب اور اس کے بعد کی دعا',
    }),
  },
  {
    id: 'wudu-mosque',
    title: t({
      nb: 'Wudu og moské',
      en: 'Wudu and mosque',
      ar: 'الوضوء والمسجد',
      ur: 'وضو اور مسجد',
    }),
    description: t({
      nb: 'Etter wudu, inn og ut av moskeen',
      en: 'After wudu, entering and leaving the mosque',
      ar: 'بعد الوضوء وعند دخول المسجد والخروج منه',
      ur: 'وضو کے بعد، مسجد میں داخل ہوتے اور نکلتے وقت',
    }),
  },
  {
    id: 'after-salah',
    title: t({
      nb: 'Etter bønnen',
      en: 'After the prayer',
      ar: 'بعد الصلاة',
      ur: 'نماز کے بعد',
    }),
    description: t({
      nb: 'Dhikr og duaer etter hver bønn',
      en: 'Dhikr and duas after every prayer',
      ar: 'الأذكار والأدعية بعد كل صلاة',
      ur: 'ہر نماز کے بعد اذکار اور دعائیں',
    }),
  },
  {
    id: 'ramadan',
    title: t({
      nb: 'Ramadan',
      en: 'Ramadan',
      ar: 'رمضان',
      ur: 'رمضان',
    }),
    description: t({
      nb: 'Iftar, fasten og Laylat-ul-Qadr',
      en: 'Iftar, the fast and Laylat al-Qadr',
      ar: 'الإفطار والصيام وليلة القدر',
      ur: 'افطار، روزہ اور لیلۃ القدر',
    }),
    season: 'ramadan',
  },
  {
    id: 'eid',
    title: t({
      nb: 'Eid',
      en: 'Eid',
      ar: 'العيد',
      ur: 'عید',
    }),
    description: t({
      nb: 'Takbir og hilsen',
      en: 'Takbir and greeting',
      ar: 'التكبير والتهنئة',
      ur: 'تکبیر اور مبارکباد',
    }),
    season: 'eid',
  },
  {
    id: 'hajj',
    title: t({
      nb: 'Hajj og Dhul-Hijjah',
      en: 'Hajj and Dhul Hijjah',
      ar: 'الحج وذو الحجة',
      ur: 'حج اور ذوالحجہ',
    }),
    description: t({
      nb: 'Talbiyah, Arafah, takbir og qurbani',
      en: 'Talbiyah, Arafah, takbir and qurbani',
      ar: 'التلبية وعرفة والتكبير والأضحية',
      ur: 'تلبیہ، عرفہ، تکبیر اور قربانی',
    }),
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
    title: t({
      nb: 'Når muezzinen kaller',
      en: 'When the muezzin calls',
      ar: 'عند سماع المؤذن',
      ur: 'جب مؤذن اذان دے',
    }),
    arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    transliteration: 'La hawla wa la quwwata illa billah',
    meaning: t({
      nb: 'Det finnes ingen kraft og ingen styrke unntatt hos Allah.',
      en: 'There is no might and no power except with Allah.',
      ar: '',
      ur: 'اللہ کے سوا نہ کوئی طاقت ہے اور نہ کوئی قوت۔',
    }),
    note: t({
      nb: 'Gjenta det muezzinen sier. Når han sier «hayya ala as-salah» og «hayya ala al-falah», sier du dette i stedet.',
      en: 'Repeat what the muezzin says. When he says «hayya ala as-salah» and «hayya ala al-falah», say this instead.',
      ar: 'ردّد ما يقوله المؤذن، وعند «حيّ على الصلاة» و«حيّ على الفلاح» قل هذا بدلًا منهما.',
      ur: 'مؤذن جو کہے وہی دہرائیں۔ جب وہ «حی علی الصلاۃ» اور «حی علی الفلاح» کہے تو اس کی جگہ یہ کہیں۔',
    }),
    source: 'Sahih al-Bukhari 611, Sahih Muslim 385',
  },
  {
    id: 'testimony-after-adhan',
    category: 'after-adhan',
    title: t({
      nb: 'Vitnesbyrd etter adhan',
      en: 'Testimony after the adhan',
      ar: 'الشهادة بعد الأذان',
      ur: 'اذان کے بعد گواہی',
    }),
    arabic:
      'أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، وَأَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ، رَضِيتُ بِاللَّهِ رَبًّا، وَبِمُحَمَّدٍ رَسُولًا، وَبِالْإِسْلَامِ دِينًا',
    transliteration:
      "Ashhadu an la ilaha illallahu wahdahu la sharika lah, wa anna Muhammadan 'abduhu wa rasuluh, raditu billahi rabban, wa bi-Muhammadin rasulan, wa bil-islami dina",
    meaning: t({
      nb: 'Jeg vitner om at ingen har rett til å tilbes unntatt Allah alene, uten partner, og at Muhammad er Hans tjener og sendebud. Jeg er tilfreds med Allah som Herre, med Muhammad som sendebud og med islam som religion.',
      en: 'I bear witness that none has the right to be worshipped except Allah alone, without partner, and that Muhammad is His servant and Messenger. I am pleased with Allah as Lord, with Muhammad as Messenger and with Islam as religion.',
      ar: '',
      ur: 'میں گواہی دیتا ہوں کہ اللہ کے سوا کوئی معبود نہیں، وہ اکیلا ہے، اس کا کوئی شریک نہیں، اور یہ کہ محمد اس کے بندے اور رسول ہیں۔ میں اللہ کے رب ہونے، محمد کے رسول ہونے اور اسلام کے دین ہونے پر راضی ہوں۔',
    }),
    source: 'Sahih Muslim 386',
  },
  {
    id: 'adhan-dua',
    category: 'after-adhan',
    title: t({
      nb: 'Dua etter adhan',
      en: 'Dua after the adhan',
      ar: 'الدعاء بعد الأذان',
      ur: 'اذان کے بعد کی دعا',
    }),
    arabic:
      'اللَّهُمَّ رَبَّ هَٰذِهِ الدَّعْوَةِ التَّامَّةِ، وَالصَّلَاةِ الْقَائِمَةِ، آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ، وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ',
    transliteration:
      "Allahumma rabba hadhihid-da'watit-tammah, was-salatil-qa'imah, ati Muhammadanil-wasilata wal-fadilah, wab'athhu maqamam mahmudanil-ladhi wa'adtah",
    meaning: t({
      nb: 'Allah, Herre over dette fullkomne kallet og bønnen som skal holdes: Gi Muhammad al-wasila og den høye rangen, og reis ham opp til den priste plassen Du har lovet ham.',
      en: 'O Allah, Lord of this perfect call and of the prayer to be established, grant Muhammad al-wasilah and excellence, and raise him to the praised station You have promised him.',
      ar: '',
      ur: 'اے اللہ! اس کامل دعوت اور قائم ہونے والی نماز کے رب، محمد کو وسیلہ اور فضیلت عطا فرما، اور انہیں اس مقامِ محمود پر فائز فرما جس کا تو نے ان سے وعدہ کیا ہے۔',
    }),
    source: 'Sahih al-Bukhari 614',
  },
  {
    id: 'after-wudu',
    category: 'wudu-mosque',
    title: t({
      nb: 'Etter wudu',
      en: 'After wudu',
      ar: 'بعد الوضوء',
      ur: 'وضو کے بعد',
    }),
    arabic:
      'أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ',
    transliteration:
      "Ashhadu an la ilaha illallahu wahdahu la sharika lah, wa ashhadu anna Muhammadan 'abduhu wa rasuluh",
    meaning: t({
      nb: 'Jeg vitner om at ingen har rett til å tilbes unntatt Allah alene, uten partner, og jeg vitner om at Muhammad er Hans tjener og sendebud.',
      en: 'I bear witness that none has the right to be worshipped except Allah alone, without partner, and I bear witness that Muhammad is His servant and Messenger.',
      ar: '',
      ur: 'میں گواہی دیتا ہوں کہ اللہ کے سوا کوئی معبود نہیں، وہ اکیلا ہے، اس کا کوئی شریک نہیں، اور میں گواہی دیتا ہوں کہ محمد اس کے بندے اور رسول ہیں۔',
    }),
    source: 'Sahih Muslim 234',
  },
  {
    id: 'entering-mosque',
    category: 'wudu-mosque',
    title: t({
      nb: 'Når du går inn i moskeen',
      en: 'Entering the mosque',
      ar: 'عند دخول المسجد',
      ur: 'مسجد میں داخل ہوتے وقت',
    }),
    arabic: 'اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ',
    transliteration: 'Allahummaf-tah li abwaba rahmatik',
    meaning: t({
      nb: 'Allah, åpne dørene til Din nåde for meg.',
      en: 'O Allah, open for me the gates of Your mercy.',
      ar: '',
      ur: 'اے اللہ! میرے لیے اپنی رحمت کے دروازے کھول دے۔',
    }),
    source: 'Sahih Muslim 713',
  },
  {
    id: 'leaving-mosque',
    category: 'wudu-mosque',
    title: t({
      nb: 'Når du går ut av moskeen',
      en: 'Leaving the mosque',
      ar: 'عند الخروج من المسجد',
      ur: 'مسجد سے نکلتے وقت',
    }),
    arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ',
    transliteration: "Allahumma inni as'aluka min fadlik",
    meaning: t({
      nb: 'Allah, jeg ber Deg om Din gavmildhet.',
      en: 'O Allah, I ask You of Your bounty.',
      ar: '',
      ur: 'اے اللہ! میں تجھ سے تیرے فضل کا سوال کرتا ہوں۔',
    }),
    source: 'Sahih Muslim 713',
  },
  {
    id: 'istighfar',
    category: 'after-salah',
    title: t({
      nb: 'Be om tilgivelse',
      en: 'Seeking forgiveness',
      ar: 'الاستغفار',
      ur: 'استغفار',
    }),
    arabic: 'أَسْتَغْفِرُ اللَّهَ',
    transliteration: 'Astaghfirullah',
    meaning: t({
      nb: 'Jeg ber Allah om tilgivelse.',
      en: 'I seek the forgiveness of Allah.',
      ar: '',
      ur: 'میں اللہ سے مغفرت مانگتا ہوں۔',
    }),
    repeat: 3,
    source: 'Sahih Muslim 591',
  },
  {
    id: 'anta-as-salam',
    category: 'after-salah',
    title: t({
      nb: 'Allahumma anta as-salam',
      en: 'Allahumma anta as-salam',
      ar: 'اللهم أنت السلام',
      ur: 'اللّٰہم انت السلام',
    }),
    arabic: 'اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ',
    transliteration: 'Allahumma antas-salam wa minkas-salam, tabarakta ya dhal-jalali wal-ikram',
    meaning: t({
      nb: 'Allah, Du er Fred, og fra Deg kommer fred. Velsignet er Du, Du som eier majestet og ære.',
      en: 'O Allah, You are Peace and from You comes peace. Blessed are You, O Possessor of majesty and honour.',
      ar: '',
      ur: 'اے اللہ! تو سلامتی والا ہے اور تجھ ہی سے سلامتی ہے۔ تو بڑی برکت والا ہے، اے بزرگی اور عزت والے۔',
    }),
    source: 'Sahih Muslim 591',
  },
  {
    id: 'la-ilaha-illallah-after-salah',
    category: 'after-salah',
    title: t({
      nb: 'La ilaha illallah',
      en: 'La ilaha illallah',
      ar: 'لا إله إلا الله',
      ur: 'لا الٰہ الا اللہ',
    }),
    arabic:
      'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ، اللَّهُمَّ لَا مَانِعَ لِمَا أَعْطَيْتَ، وَلَا مُعْطِيَ لِمَا مَنَعْتَ، وَلَا يَنْفَعُ ذَا الْجَدِّ مِنْكَ الْجَدُّ',
    transliteration:
      "La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamdu wa huwa 'ala kulli shay'in qadir. Allahumma la mani'a lima a'tayta, wa la mu'tiya lima mana'ta, wa la yanfa'u dhal-jaddi minkal-jadd",
    meaning: t({
      nb: 'Ingen har rett til å tilbes unntatt Allah alene, uten partner. Hans er herredømmet og Hans er lovprisningen, og Han har makt over alle ting. Allah, ingen kan holde tilbake det Du gir, og ingen kan gi det Du holder tilbake. Rikdom og status hjelper ingen mot Deg.',
      en: 'None has the right to be worshipped except Allah alone, without partner. His is the dominion and His is the praise, and He is over all things competent. O Allah, none can withhold what You give, and none can give what You withhold, and the wealth of the wealthy cannot avail him against You.',
      ar: '',
      ur: 'اللہ کے سوا کوئی معبود نہیں، وہ اکیلا ہے، اس کا کوئی شریک نہیں۔ اسی کی بادشاہی ہے اور اسی کے لیے تمام تعریف ہے، اور وہ ہر چیز پر قادر ہے۔ اے اللہ! جو تو عطا کرے اسے کوئی روکنے والا نہیں، اور جو تو روک لے اسے کوئی دینے والا نہیں، اور کسی دولت مند کو اس کی دولت تیرے مقابلے میں نفع نہیں دے سکتی۔',
    }),
    source: 'Sahih al-Bukhari 844, Sahih Muslim 593',
  },
  {
    id: 'tasbih',
    category: 'after-salah',
    title: t({
      nb: 'Subhanallah, Alhamdulillah, Allahu akbar',
      en: 'Subhanallah, Alhamdulillah, Allahu akbar',
      ar: 'سبحان الله، الحمد لله، الله أكبر',
      ur: 'سبحان اللہ، الحمد للہ، اللہ اکبر',
    }),
    arabic: 'سُبْحَانَ اللَّهِ\nالْحَمْدُ لِلَّهِ\nاللَّهُ أَكْبَرُ',
    transliteration: 'Subhanallah\nAlhamdulillah\nAllahu akbar',
    meaning: t({
      nb: 'Allah er hevet over alle mangler.\nAll lovprisning tilhører Allah.\nAllah er størst.',
      en: 'Glory be to Allah.\nAll praise is for Allah.\nAllah is the Greatest.',
      ar: '',
      ur: 'اللہ پاک ہے۔\nتمام تعریف اللہ کے لیے ہے۔\nاللہ سب سے بڑا ہے۔',
    }),
    note: t({
      nb: 'Si hver av dem 33 ganger.',
      en: 'Say each of them 33 times.',
      ar: 'قل كل واحدة منها 33 مرة.',
      ur: 'ہر ایک 33 مرتبہ کہیں۔',
    }),
    repeat: 33,
    source: 'Sahih Muslim 597',
  },
  {
    id: 'tasbih-completion',
    category: 'after-salah',
    title: t({
      nb: 'Til sammen hundre',
      en: 'Completing the hundred',
      ar: 'تمام المئة',
      ur: 'سو پورے کرنا',
    }),
    arabic:
      'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
    transliteration:
      "La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamdu wa huwa 'ala kulli shay'in qadir",
    meaning: t({
      nb: 'Ingen har rett til å tilbes unntatt Allah alene, uten partner. Hans er herredømmet og Hans er lovprisningen, og Han har makt over alle ting.',
      en: 'None has the right to be worshipped except Allah alone, without partner. His is the dominion and His is the praise, and He is over all things competent.',
      ar: '',
      ur: 'اللہ کے سوا کوئی معبود نہیں، وہ اکیلا ہے، اس کا کوئی شریک نہیں۔ اسی کی بادشاہی ہے اور اسی کے لیے تمام تعریف ہے، اور وہ ہر چیز پر قادر ہے۔',
    }),
    note: t({
      nb: 'Sies én gang etter de tre rundene med 33, så det blir hundre til sammen.',
      en: 'Said once after the three rounds of 33, making a hundred in total.',
      ar: 'تُقال مرة واحدة بعد الجولات الثلاث من 33، لتتم المئة.',
      ur: '33 کے تینوں دوروں کے بعد ایک مرتبہ کہیں، تاکہ کل سو ہو جائیں۔',
    }),
    source: 'Sahih Muslim 597',
  },
  {
    id: 'ayat-al-kursi',
    category: 'after-salah',
    title: t({
      nb: 'Ayat al-Kursi',
      en: 'Ayat al-Kursi',
      ar: 'آية الكرسي',
      ur: 'آیت الکرسی',
    }),
    arabic:
      'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ',
    transliteration:
      "Allahu la ilaha illa huwal-hayyul-qayyum. La ta'khudhuhu sinatun wa la nawm. Lahu ma fis-samawati wa ma fil-ard. Man dhal-ladhi yashfa'u 'indahu illa bi-idhnih. Ya'lamu ma bayna aydihim wa ma khalfahum, wa la yuhituna bi-shay'im-min 'ilmihi illa bima sha'. Wasi'a kursiyyuhus-samawati wal-ard, wa la ya'uduhu hifzuhuma, wa huwal-'aliyyul-'azim",
    meaning: t({
      nb: 'Allah, ingen har rett til å tilbes unntatt Ham, Den Levende, Den som opprettholder alt. Verken slummer eller søvn tar Ham. Hans er alt i himlene og på jorden. Hvem kan gå i forbønn hos Ham uten Hans tillatelse? Han vet hva som ligger foran dem og hva som ligger bak dem, og de fatter ingenting av Hans kunnskap unntatt det Han vil. Hans trone omfatter himlene og jorden, og å bevare dem tretter Ham ikke. Han er Den Opphøyde, Den Veldige.',
      en: 'Allah, there is no deity except Him, the Ever-Living, the Sustainer of all existence. Neither drowsiness overtakes Him nor sleep. To Him belongs whatever is in the heavens and whatever is on the earth. Who is it that can intercede with Him except by His permission? He knows what is before them and what will be after them, and they encompass nothing of His knowledge except what He wills. His Kursi extends over the heavens and the earth, and their preservation tires Him not. And He is the Most High, the Most Great.',
      ar: '',
      ur: 'اللہ، اس کے سوا کوئی معبود نہیں، وہ زندہ ہے، سب کو قائم رکھنے والا ہے۔ اسے نہ اونگھ آتی ہے اور نہ نیند۔ آسمانوں اور زمین میں جو کچھ ہے سب اسی کا ہے۔ کون ہے جو اس کی اجازت کے بغیر اس کے حضور سفارش کر سکے؟ وہ جانتا ہے جو کچھ ان کے سامنے ہے اور جو کچھ ان کے پیچھے ہے، اور وہ اس کے علم میں سے کسی چیز کا احاطہ نہیں کر سکتے مگر جتنا وہ چاہے۔ اس کی کرسی آسمانوں اور زمین پر محیط ہے، اور ان کی حفاظت اسے تھکاتی نہیں۔ اور وہ بلند و برتر، بہت عظمت والا ہے۔',
    }),
    source: t({
      nb: "Koranen 2:255. Etter bønnen: an-Nasa'i, as-Sunan al-Kubra 9848",
      en: "Quran 2:255. After the prayer: an-Nasa'i, as-Sunan al-Kubra 9848",
      ar: 'القرآن 2:255. بعد الصلاة: النسائي، السنن الكبرى 9848',
      ur: 'قرآن 2:255۔ نماز کے بعد: نسائی، السنن الکبریٰ 9848',
    }),
  },
  {
    id: 'muawwidhat',
    category: 'after-salah',
    title: t({
      nb: 'De tre siste surene',
      en: 'The last three surahs',
      ar: 'المعوذات',
      ur: 'آخری تین سورتیں',
    }),
    arabic:
      'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\nقُلْ هُوَ اللَّهُ أَحَدٌ ﴿١﴾ اللَّهُ الصَّمَدُ ﴿٢﴾ لَمْ يَلِدْ وَلَمْ يُولَدْ ﴿٣﴾ وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ ﴿٤﴾\n\nبِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\nقُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ﴿١﴾ مِنْ شَرِّ مَا خَلَقَ ﴿٢﴾ وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ ﴿٣﴾ وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ﴿٤﴾ وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ ﴿٥﴾\n\nبِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\nقُلْ أَعُوذُ بِرَبِّ النَّاسِ ﴿١﴾ مَلِكِ النَّاسِ ﴿٢﴾ إِلَٰهِ النَّاسِ ﴿٣﴾ مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ﴿٤﴾ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ﴿٥﴾ مِنَ الْجِنَّةِ وَالنَّاسِ ﴿٦﴾',
    transliteration:
      "Qul huwallahu ahad. Allahus-samad. Lam yalid wa lam yulad. Wa lam yakul-lahu kufuwan ahad.\n\nQul a'udhu bi-rabbil-falaq. Min sharri ma khalaq. Wa min sharri ghasiqin idha waqab. Wa min sharrin-naffathati fil-'uqad. Wa min sharri hasidin idha hasad.\n\nQul a'udhu bi-rabbin-nas. Malikin-nas. Ilahin-nas. Min sharril-waswasil-khannas. Alladhi yuwaswisu fi sudurin-nas. Minal-jinnati wan-nas.",
    meaning: t({
      nb: 'Al-Ikhlas: Si: Han er Allah, Den Ene. Allah, Den alle trenger. Han har ikke fått barn og er ikke født. Og ingen er Hans like.\n\nAl-Falaq: Si: Jeg søker tilflukt hos morgengryets Herre, mot ondskapen i det Han har skapt, mot ondskapen i mørket når det senker seg, mot ondskapen hos dem som blåser på knuter, og mot ondskapen hos den misunnelige når han misunner.\n\nAn-Nas: Si: Jeg søker tilflukt hos menneskenes Herre, menneskenes Konge, menneskenes Gud, mot ondskapen hos hviskeren som trekker seg unna, han som hvisker i menneskenes bryst, blant jinn og mennesker.',
      en: 'Al-Ikhlas: Say, He is Allah, the One. Allah, the Eternal Refuge. He neither begets nor is born. Nor is there to Him any equivalent.\n\nAl-Falaq: Say, I seek refuge in the Lord of daybreak, from the evil of that which He created, and from the evil of darkness when it settles, and from the evil of the blowers in knots, and from the evil of an envier when he envies.\n\nAn-Nas: Say, I seek refuge in the Lord of mankind, the Sovereign of mankind, the God of mankind, from the evil of the retreating whisperer, who whispers into the breasts of mankind, from among the jinn and mankind.',
      ar: '',
      ur: 'سورۃ الاخلاص: کہہ دیجیے، وہ اللہ ایک ہے۔ اللہ بے نیاز ہے۔ نہ اس نے کسی کو جنا اور نہ وہ جنا گیا۔ اور کوئی اس کا ہمسر نہیں۔\n\nسورۃ الفلق: کہہ دیجیے، میں صبح کے رب کی پناہ میں آتا ہوں، ہر اس چیز کے شر سے جو اس نے پیدا کی، اور اندھیری رات کے شر سے جب وہ چھا جائے، اور گرہوں میں پھونکنے والیوں کے شر سے، اور حسد کرنے والے کے شر سے جب وہ حسد کرے۔\n\nسورۃ الناس: کہہ دیجیے، میں لوگوں کے رب کی پناہ میں آتا ہوں، لوگوں کے بادشاہ کی، لوگوں کے معبود کی، وسوسہ ڈالنے والے، پیچھے ہٹ جانے والے کے شر سے، جو لوگوں کے سینوں میں وسوسہ ڈالتا ہے، جنوں میں سے بھی اور انسانوں میں سے بھی۔',
    }),
    note: t({
      nb: 'Leses én gang etter hver bønn.',
      en: 'Recited once after every prayer.',
      ar: 'تُقرأ مرة واحدة بعد كل صلاة.',
      ur: 'ہر نماز کے بعد ایک مرتبہ پڑھیں۔',
    }),
    source: t({
      nb: "Koranen 112-114. Etter bønnen: Sunan Abi Dawud 1523, Jami' at-Tirmidhi 2903",
      en: "Quran 112-114. After the prayer: Sunan Abi Dawud 1523, Jami' at-Tirmidhi 2903",
      ar: 'القرآن 112-114. بعد الصلاة: سنن أبي داود 1523، جامع الترمذي 2903',
      ur: 'قرآن 112-114۔ نماز کے بعد: سنن ابی داؤد 1523، جامع ترمذی 2903',
    }),
  },
  {
    id: 'help-me-remember',
    category: 'after-salah',
    title: t({
      nb: 'Hjelp meg å minnes Deg',
      en: 'Help me remember You',
      ar: 'أعنّي على ذكرك',
      ur: 'اپنے ذکر پر میری مدد فرما',
    }),
    arabic: 'اللَّهُمَّ أَعِنِّي عَلَىٰ ذِكْرِكَ، وَشُكْرِكَ، وَحُسْنِ عِبَادَتِكَ',
    transliteration: "Allahumma a'inni 'ala dhikrika, wa shukrika, wa husni 'ibadatik",
    meaning: t({
      nb: 'Allah, hjelp meg å minnes Deg, å takke Deg og å tilbe Deg på best mulig måte.',
      en: 'O Allah, help me to remember You, to thank You and to worship You in the best manner.',
      ar: '',
      ur: 'اے اللہ! اپنے ذکر، اپنے شکر اور اپنی اچھی عبادت پر میری مدد فرما۔',
    }),
    source: 'Sunan Abi Dawud 1522',
  },
  {
    id: 'iftar',
    category: 'ramadan',
    title: t({
      nb: 'Dua ved iftar',
      en: 'Dua at iftar',
      ar: 'دعاء الإفطار',
      ur: 'افطار کی دعا',
    }),
    arabic: 'ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ وَثَبَتَ الْأَجْرُ إِنْ شَاءَ اللَّهُ',
    transliteration: "Dhahabaz-zama'u wabtallatil-'uruqu wa thabatal-ajru in sha' Allah",
    meaning: t({
      nb: 'Tørsten er borte, årene er fuktet, og lønnen er sikret, om Allah vil.',
      en: 'The thirst has gone, the veins are moistened, and the reward is confirmed, if Allah wills.',
      ar: '',
      ur: 'پیاس بجھ گئی، رگیں تر ہو گئیں، اور ان شاء اللہ اجر ثابت ہو گیا۔',
    }),
    note: t({
      nb: 'Sies når du bryter fasten.',
      en: 'Said when you break the fast.',
      ar: 'تُقال عند الإفطار.',
      ur: 'روزہ افطار کرتے وقت کہیں۔',
    }),
    source: 'Sunan Abi Dawud 2357',
  },
  {
    id: 'laylat-al-qadr',
    category: 'ramadan',
    title: t({
      nb: 'Dua for Laylat-ul-Qadr',
      en: 'Dua for Laylat al-Qadr',
      ar: 'دعاء ليلة القدر',
      ur: 'لیلۃ القدر کی دعا',
    }),
    arabic: 'اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي',
    transliteration: "Allahumma innaka 'afuwwun tuhibbul-'afwa fa'fu 'anni",
    meaning: t({
      nb: 'Allah, Du er Den som tilgir, og Du elsker å tilgi, så tilgi meg.',
      en: 'O Allah, You are Pardoning and You love to pardon, so pardon me.',
      ar: '',
      ur: 'اے اللہ! تو بہت معاف کرنے والا ہے، معاف کرنے کو پسند کرتا ہے، پس مجھے معاف فرما دے۔',
    }),
    note: t({
      nb: 'Profeten lærte Aisha å si denne duaen.',
      en: 'The Prophet taught Aisha to say this dua.',
      ar: 'علّم النبي ﷺ عائشة هذا الدعاء.',
      ur: 'نبی ﷺ نے حضرت عائشہؓ کو یہ دعا سکھائی۔',
    }),
    source: "Jami' at-Tirmidhi 3513, Sunan Ibn Majah 3850",
  },
  {
    id: 'i-am-fasting',
    category: 'ramadan',
    title: t({
      nb: 'Når noen provoserer deg',
      en: 'When someone provokes you',
      ar: 'إذا استفزّك أحد',
      ur: 'جب کوئی آپ کو اشتعال دلائے',
    }),
    arabic: 'إِنِّي صَائِمٌ',
    transliteration: "Inni sa'im",
    meaning: t({
      nb: 'Jeg faster.',
      en: 'I am fasting.',
      ar: '',
      ur: 'میں روزے سے ہوں۔',
    }),
    note: t({
      nb: 'Sies hvis noen krangler med deg eller fornærmer deg mens du faster.',
      en: 'Said if someone argues with you or insults you while you are fasting.',
      ar: 'تُقال إذا جادلك أحد أو شتمك وأنت صائم.',
      ur: 'اگر روزے کی حالت میں کوئی آپ سے جھگڑے یا آپ کو برا بھلا کہے تو یہ کہیں۔',
    }),
    source: 'Sahih al-Bukhari 1904',
  },
  {
    id: 'iftar-as-guest',
    category: 'ramadan',
    title: t({
      nb: 'Når du bryter fasten hos andre',
      en: 'Breaking the fast with others',
      ar: 'عند الإفطار عند غيرك',
      ur: 'کسی کے ہاں روزہ افطار کرتے وقت',
    }),
    arabic:
      'أَفْطَرَ عِنْدَكُمُ الصَّائِمُونَ، وَأَكَلَ طَعَامَكُمُ الْأَبْرَارُ، وَصَلَّتْ عَلَيْكُمُ الْمَلَائِكَةُ',
    transliteration:
      "Aftara 'indakumus-sa'imun, wa akala ta'amakumul-abrar, wa sallat 'alaykumul-mala'ikah",
    meaning: t({
      nb: 'Må de fastende bryte fasten hos dere, må de rettskafne spise maten deres, og må englene be for dere.',
      en: 'May the fasting break their fast with you, may the righteous eat your food, and may the angels pray for you.',
      ar: '',
      ur: 'تمہارے ہاں روزہ دار افطار کریں، نیک لوگ تمہارا کھانا کھائیں، اور فرشتے تمہارے لیے رحمت کی دعا کریں۔',
    }),
    source: 'Sunan Abi Dawud 3854',
  },
  {
    id: 'talbiyah',
    category: 'hajj',
    title: t({
      nb: 'Talbiyah',
      en: 'Talbiyah',
      ar: 'التلبية',
      ur: 'تلبیہ',
    }),
    arabic:
      'لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيكَ لَكَ',
    transliteration:
      "Labbayk Allahumma labbayk, labbayka la sharika laka labbayk, innal-hamda wan-ni'mata laka wal-mulk, la sharika lak",
    meaning: t({
      nb: 'Her er jeg, Allah, her er jeg. Her er jeg, Du har ingen partner, her er jeg. All lovprisning og all nåde tilhører Deg, og herredømmet. Du har ingen partner.',
      en: 'Here I am, O Allah, here I am. Here I am, You have no partner, here I am. Truly all praise and favour are Yours, and the dominion. You have no partner.',
      ar: '',
      ur: 'میں حاضر ہوں، اے اللہ میں حاضر ہوں۔ میں حاضر ہوں، تیرا کوئی شریک نہیں، میں حاضر ہوں۔ بے شک تمام تعریف اور نعمت تیرے ہی لیے ہے، اور بادشاہی بھی۔ تیرا کوئی شریک نہیں۔',
    }),
    note: t({
      nb: 'Sies av pilegrimer fra de går i ihram til de kaster steiner på Eid-dagen.',
      en: 'Said by pilgrims from entering ihram until they stone on the day of Eid.',
      ar: 'يقولها الحاج من الإحرام حتى رمي الجمرة يوم العيد.',
      ur: 'حاجی احرام باندھنے سے لے کر عید کے دن رمی تک یہ کہتے ہیں۔',
    }),
    source: 'Sahih al-Bukhari 1549, Sahih Muslim 1184',
  },
  {
    id: 'arafah',
    category: 'hajj',
    title: t({
      nb: 'Den beste duaen på Arafah-dagen',
      en: 'The best dua on the day of Arafah',
      ar: 'خير الدعاء يوم عرفة',
      ur: 'یومِ عرفہ کی بہترین دعا',
    }),
    arabic:
      'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
    transliteration:
      "La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamd, wa huwa 'ala kulli shay'in qadir",
    meaning: t({
      nb: 'Ingen har rett til å tilbes unntatt Allah alene, uten partner. Herredømmet og all lovprisning tilhører Ham, og Han har makt over alle ting.',
      en: 'None has the right to be worshipped except Allah alone, without partner. To Him belong the dominion and all praise, and He is over all things competent.',
      ar: '',
      ur: 'اللہ کے سوا کوئی معبود نہیں، وہ اکیلا ہے، اس کا کوئی شریک نہیں۔ اسی کی بادشاہی ہے اور اسی کے لیے تمام تعریف ہے، اور وہ ہر چیز پر قادر ہے۔',
    }),
    note: t({
      nb: 'Profeten sa at den beste duaen er duaen på Arafah-dagen, og at dette er det beste han og profetene før ham har sagt.',
      en: 'The Prophet said the best dua is the dua on the day of Arafah, and that this is the best that he and the prophets before him have said.',
      ar: 'قال النبي ﷺ إن خير الدعاء دعاء يوم عرفة، وإن هذا خير ما قاله هو والنبيون من قبله.',
      ur: 'نبی ﷺ نے فرمایا کہ بہترین دعا یومِ عرفہ کی دعا ہے، اور یہ سب سے بہتر کلمہ ہے جو آپ نے اور آپ سے پہلے انبیاء نے کہا۔',
    }),
    source: "Jami' at-Tirmidhi 3585",
  },
  {
    id: 'takbir-dhul-hijjah',
    category: 'hajj',
    title: t({
      nb: 'Takbir i Dhul-Hijjah',
      en: 'Takbir in Dhul Hijjah',
      ar: 'التكبير في ذي الحجة',
      ur: 'ذوالحجہ میں تکبیر',
    }),
    arabic:
      'اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، لَا إِلَٰهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، وَلِلَّهِ الْحَمْدُ',
    transliteration: 'Allahu akbar, Allahu akbar, la ilaha illallah, wallahu akbar, Allahu akbar, wa lillahil-hamd',
    meaning: t({
      nb: 'Allah er størst, Allah er størst, ingen har rett til å tilbes unntatt Allah. Allah er størst, Allah er størst, og all lovprisning tilhører Allah.',
      en: 'Allah is the Greatest, Allah is the Greatest, none has the right to be worshipped except Allah. Allah is the Greatest, Allah is the Greatest, and all praise is for Allah.',
      ar: '',
      ur: 'اللہ سب سے بڑا ہے، اللہ سب سے بڑا ہے، اللہ کے سوا کوئی معبود نہیں۔ اللہ سب سے بڑا ہے، اللہ سب سے بڑا ہے، اور تمام تعریف اللہ ہی کے لیے ہے۔',
    }),
    note: t({
      nb: 'Sies ofte de ti første dagene, og etter bønnene fra Arafah-dagen til og med 13. Dhul-Hijjah.',
      en: 'Said often during the first ten days, and after the prayers from the day of Arafah through 13 Dhul Hijjah.',
      ar: 'يُكثر منه في العشر الأوائل، وبعد الصلوات من يوم عرفة حتى 13 ذي الحجة.',
      ur: 'پہلے دس دنوں میں کثرت سے، اور یومِ عرفہ سے 13 ذوالحجہ تک نمازوں کے بعد کہیں۔',
    }),
    source: t({
      nb: 'Musannaf Ibn Abi Shaybah, fra Abdullah ibn Masud',
      en: 'Musannaf Ibn Abi Shaybah, from Abdullah ibn Masud',
      ar: 'مصنف ابن أبي شيبة، عن عبد الله بن مسعود',
      ur: 'مصنف ابن ابی شیبہ، از عبداللہ بن مسعودؓ',
    }),
  },
  {
    id: 'between-the-corners',
    category: 'hajj',
    title: t({
      nb: 'Mellom Rukn al-Yamani og Den svarte steinen',
      en: 'Between the Yemeni Corner and the Black Stone',
      ar: 'بين الركن اليماني والحجر الأسود',
      ur: 'رکنِ یمانی اور حجرِ اسود کے درمیان',
    }),
    arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
    transliteration: "Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina 'adhaban-nar",
    meaning: t({
      nb: 'Vår Herre, gi oss det gode i dette livet og det gode i det neste, og vern oss mot straffen i Ilden.',
      en: 'Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.',
      ar: '',
      ur: 'اے ہمارے رب! ہمیں دنیا میں بھلائی دے اور آخرت میں بھی بھلائی دے، اور ہمیں آگ کے عذاب سے بچا۔',
    }),
    note: t({
      nb: 'Sies under tawaf, på strekningen mellom de to hjørnene av Kaba.',
      en: 'Said during tawaf, on the stretch between these two corners of the Kaaba.',
      ar: 'تُقال في الطواف بين هذين الركنين من الكعبة.',
      ur: 'طواف کے دوران کعبہ کے ان دو کونوں کے درمیان پڑھیں۔',
    }),
    source: t({
      nb: 'Sunan Abi Dawud 1892. Koranen 2:201',
      en: 'Sunan Abi Dawud 1892. Quran 2:201',
      ar: 'سنن أبي داود 1892. القرآن 2:201',
      ur: 'سنن ابی داؤد 1892۔ قرآن 2:201',
    }),
  },
  {
    id: 'qurbani',
    category: 'hajj',
    title: t({
      nb: 'Når du slakter qurbani',
      en: 'When slaughtering the qurbani',
      ar: 'عند ذبح الأضحية',
      ur: 'قربانی ذبح کرتے وقت',
    }),
    arabic: 'بِسْمِ اللَّهِ وَاللَّهُ أَكْبَرُ',
    transliteration: 'Bismillahi wallahu akbar',
    meaning: t({
      nb: 'I Allahs navn, og Allah er størst.',
      en: 'In the name of Allah, and Allah is the Greatest.',
      ar: '',
      ur: 'اللہ کے نام سے، اور اللہ سب سے بڑا ہے۔',
    }),
    source: 'Sahih Muslim 1966',
  },
  {
    id: 'takbir-eid',
    category: 'eid',
    title: t({
      nb: 'Takbir',
      en: 'Takbir',
      ar: 'التكبير',
      ur: 'تکبیر',
    }),
    arabic:
      'اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، لَا إِلَٰهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، وَلِلَّهِ الْحَمْدُ',
    transliteration: 'Allahu akbar, Allahu akbar, la ilaha illallah, wallahu akbar, Allahu akbar, wa lillahil-hamd',
    meaning: t({
      nb: 'Allah er størst, Allah er størst, ingen har rett til å tilbes unntatt Allah. Allah er størst, Allah er størst, og all lovprisning tilhører Allah.',
      en: 'Allah is the Greatest, Allah is the Greatest, none has the right to be worshipped except Allah. Allah is the Greatest, Allah is the Greatest, and all praise is for Allah.',
      ar: '',
      ur: 'اللہ سب سے بڑا ہے، اللہ سب سے بڑا ہے، اللہ کے سوا کوئی معبود نہیں۔ اللہ سب سے بڑا ہے، اللہ سب سے بڑا ہے، اور تمام تعریف اللہ ہی کے لیے ہے۔',
    }),
    note: t({
      nb: 'Sies fra kvelden før Eid al-Fitr til Eid-bønnen, og etter bønnene fra Arafah-dagen til og med 13. Dhul-Hijjah.',
      en: 'Said from the eve of Eid al-Fitr until the Eid prayer, and after the prayers from the day of Arafah through 13 Dhul Hijjah.',
      ar: 'تُقال من ليلة عيد الفطر حتى صلاة العيد، وبعد الصلوات من يوم عرفة حتى 13 ذي الحجة.',
      ur: 'عید الفطر کی چاند رات سے عید کی نماز تک، اور یومِ عرفہ سے 13 ذوالحجہ تک نمازوں کے بعد کہیں۔',
    }),
    source: t({
      nb: 'Musannaf Ibn Abi Shaybah, fra Abdullah ibn Masud',
      en: 'Musannaf Ibn Abi Shaybah, from Abdullah ibn Masud',
      ar: 'مصنف ابن أبي شيبة، عن عبد الله بن مسعود',
      ur: 'مصنف ابن ابی شیبہ، از عبداللہ بن مسعودؓ',
    }),
  },
  {
    id: 'eid-greeting',
    category: 'eid',
    title: t({
      nb: 'Eid-hilsen',
      en: 'Eid greeting',
      ar: 'تهنئة العيد',
      ur: 'عید کی مبارکباد',
    }),
    arabic: 'تَقَبَّلَ اللَّهُ مِنَّا وَمِنْكُمْ',
    transliteration: 'Taqabbalallahu minna wa minkum',
    meaning: t({
      nb: 'Må Allah ta imot fra oss og fra dere.',
      en: 'May Allah accept from us and from you.',
      ar: '',
      ur: 'اللہ ہم سے اور آپ سے قبول فرمائے۔',
    }),
    note: t({
      nb: 'Følgesvennene hilste hverandre slik når de møttes på Eid.',
      en: 'The Companions greeted each other like this when they met on Eid.',
      ar: 'كان الصحابة يهنّئ بعضهم بعضًا بهذا إذا التقوا يوم العيد.',
      ur: 'صحابہ کرامؓ عید کے دن ملتے وقت ایک دوسرے کو یوں مبارکباد دیتے تھے۔',
    }),
    source: t({
      nb: "Fath al-Bari, fra Jubayr ibn Nufayr",
      en: 'Fath al-Bari, from Jubayr ibn Nufayr',
      ar: 'فتح الباري، عن جبير بن نفير',
      ur: 'فتح الباری، از جبیر بن نفیر',
    }),
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
