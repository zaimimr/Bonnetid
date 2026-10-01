export type DuaCategoryId = 'after-adhan' | 'wudu-mosque' | 'after-salah' | 'ramadan' | 'hajj';

export type DuaSeason = 'ramadan' | 'dhul-hijjah';

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
  { id: 'after-adhan', title: 'Etter adhan', description: 'Svar på kallet og duaen etterpå' },
  { id: 'wudu-mosque', title: 'Wudu og moské', description: 'Etter wudu, inn og ut av moskeen' },
  { id: 'after-salah', title: 'Etter bønnen', description: 'Dhikr og duaer etter hver bønn' },
  {
    id: 'ramadan',
    title: 'Ramadan',
    description: 'Iftar, fasten og Laylat-ul-Qadr',
    season: 'ramadan',
  },
  {
    id: 'hajj',
    title: 'Hajj og Dhul-Hijjah',
    description: 'Talbiyah, Arafah, takbir og qurbani',
    season: 'dhul-hijjah',
  },
];

export const DUA_LINKS = {
  hajj: 'hajj',
  iftar: 'iftar',
  laylatAlQadr: 'laylat-al-qadr',
} as const;

export const DUAS: Dua[] = [
  {
    id: 'answer-muezzin',
    category: 'after-adhan',
    title: 'Når muezzinen kaller',
    arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    transliteration: 'La hawla wa la quwwata illa billah',
    meaning: 'Det finnes ingen kraft og ingen styrke unntatt hos Allah.',
    note: 'Gjenta det muezzinen sier. Når han sier «hayya ala as-salah» og «hayya ala al-falah», sier du dette i stedet.',
    source: 'Sahih al-Bukhari 611, Sahih Muslim 385',
  },
  {
    id: 'testimony-after-adhan',
    category: 'after-adhan',
    title: 'Vitnesbyrd etter adhan',
    arabic:
      'أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، وَأَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ، رَضِيتُ بِاللَّهِ رَبًّا، وَبِمُحَمَّدٍ رَسُولًا، وَبِالْإِسْلَامِ دِينًا',
    transliteration:
      "Ashhadu an la ilaha illallahu wahdahu la sharika lah, wa anna Muhammadan 'abduhu wa rasuluh, raditu billahi rabban, wa bi-Muhammadin rasulan, wa bil-islami dina",
    meaning:
      'Jeg vitner om at ingen har rett til å tilbes unntatt Allah alene, uten partner, og at Muhammad er Hans tjener og sendebud. Jeg er tilfreds med Allah som Herre, med Muhammad som sendebud og med islam som religion.',
    source: 'Sahih Muslim 386',
  },
  {
    id: 'adhan-dua',
    category: 'after-adhan',
    title: 'Dua etter adhan',
    arabic:
      'اللَّهُمَّ رَبَّ هَٰذِهِ الدَّعْوَةِ التَّامَّةِ، وَالصَّلَاةِ الْقَائِمَةِ، آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ، وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ',
    transliteration:
      "Allahumma rabba hadhihid-da'watit-tammah, was-salatil-qa'imah, ati Muhammadanil-wasilata wal-fadilah, wab'athhu maqamam mahmudanil-ladhi wa'adtah",
    meaning:
      'Allah, Herre over dette fullkomne kallet og bønnen som skal holdes: Gi Muhammad al-wasila og den høye rangen, og reis ham opp til den priste plassen Du har lovet ham.',
    source: 'Sahih al-Bukhari 614',
  },
  {
    id: 'after-wudu',
    category: 'wudu-mosque',
    title: 'Etter wudu',
    arabic:
      'أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ',
    transliteration:
      "Ashhadu an la ilaha illallahu wahdahu la sharika lah, wa ashhadu anna Muhammadan 'abduhu wa rasuluh",
    meaning:
      'Jeg vitner om at ingen har rett til å tilbes unntatt Allah alene, uten partner, og jeg vitner om at Muhammad er Hans tjener og sendebud.',
    source: 'Sahih Muslim 234',
  },
  {
    id: 'entering-mosque',
    category: 'wudu-mosque',
    title: 'Når du går inn i moskeen',
    arabic: 'اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ',
    transliteration: 'Allahummaf-tah li abwaba rahmatik',
    meaning: 'Allah, åpne dørene til Din nåde for meg.',
    source: 'Sahih Muslim 713',
  },
  {
    id: 'leaving-mosque',
    category: 'wudu-mosque',
    title: 'Når du går ut av moskeen',
    arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ',
    transliteration: "Allahumma inni as'aluka min fadlik",
    meaning: 'Allah, jeg ber Deg om Din gavmildhet.',
    source: 'Sahih Muslim 713',
  },
  {
    id: 'istighfar',
    category: 'after-salah',
    title: 'Be om tilgivelse',
    arabic: 'أَسْتَغْفِرُ اللَّهَ',
    transliteration: 'Astaghfirullah',
    meaning: 'Jeg ber Allah om tilgivelse.',
    repeat: 3,
    source: 'Sahih Muslim 591',
  },
  {
    id: 'anta-as-salam',
    category: 'after-salah',
    title: 'Allahumma anta as-salam',
    arabic: 'اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ',
    transliteration: 'Allahumma antas-salam wa minkas-salam, tabarakta ya dhal-jalali wal-ikram',
    meaning: 'Allah, Du er Fred, og fra Deg kommer fred. Velsignet er Du, Du som eier majestet og ære.',
    source: 'Sahih Muslim 591',
  },
  {
    id: 'la-ilaha-illallah-after-salah',
    category: 'after-salah',
    title: 'La ilaha illallah',
    arabic:
      'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ، اللَّهُمَّ لَا مَانِعَ لِمَا أَعْطَيْتَ، وَلَا مُعْطِيَ لِمَا مَنَعْتَ، وَلَا يَنْفَعُ ذَا الْجَدِّ مِنْكَ الْجَدُّ',
    transliteration:
      "La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamdu wa huwa 'ala kulli shay'in qadir. Allahumma la mani'a lima a'tayta, wa la mu'tiya lima mana'ta, wa la yanfa'u dhal-jaddi minkal-jadd",
    meaning:
      'Ingen har rett til å tilbes unntatt Allah alene, uten partner. Hans er herredømmet og Hans er lovprisningen, og Han har makt over alle ting. Allah, ingen kan holde tilbake det Du gir, og ingen kan gi det Du holder tilbake. Rikdom og status hjelper ingen mot Deg.',
    source: 'Sahih al-Bukhari 844, Sahih Muslim 593',
  },
  {
    id: 'tasbih',
    category: 'after-salah',
    title: 'Subhanallah, Alhamdulillah, Allahu akbar',
    arabic: 'سُبْحَانَ اللَّهِ\nالْحَمْدُ لِلَّهِ\nاللَّهُ أَكْبَرُ',
    transliteration: 'Subhanallah\nAlhamdulillah\nAllahu akbar',
    meaning: 'Allah er hevet over alle mangler.\nAll lovprisning tilhører Allah.\nAllah er størst.',
    note: 'Si hver av dem 33 ganger.',
    repeat: 33,
    source: 'Sahih Muslim 597',
  },
  {
    id: 'tasbih-completion',
    category: 'after-salah',
    title: 'Til sammen hundre',
    arabic:
      'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
    transliteration:
      "La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamdu wa huwa 'ala kulli shay'in qadir",
    meaning:
      'Ingen har rett til å tilbes unntatt Allah alene, uten partner. Hans er herredømmet og Hans er lovprisningen, og Han har makt over alle ting.',
    note: 'Sies én gang etter de tre rundene med 33, så det blir hundre til sammen.',
    source: 'Sahih Muslim 597',
  },
  {
    id: 'ayat-al-kursi',
    category: 'after-salah',
    title: 'Ayat al-Kursi',
    arabic:
      'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ',
    transliteration:
      "Allahu la ilaha illa huwal-hayyul-qayyum. La ta'khudhuhu sinatun wa la nawm. Lahu ma fis-samawati wa ma fil-ard. Man dhal-ladhi yashfa'u 'indahu illa bi-idhnih. Ya'lamu ma bayna aydihim wa ma khalfahum, wa la yuhituna bi-shay'im-min 'ilmihi illa bima sha'. Wasi'a kursiyyuhus-samawati wal-ard, wa la ya'uduhu hifzuhuma, wa huwal-'aliyyul-'azim",
    meaning:
      'Allah, ingen har rett til å tilbes unntatt Ham, Den Levende, Den som opprettholder alt. Verken slummer eller søvn tar Ham. Hans er alt i himlene og på jorden. Hvem kan gå i forbønn hos Ham uten Hans tillatelse? Han vet hva som ligger foran dem og hva som ligger bak dem, og de fatter ingenting av Hans kunnskap unntatt det Han vil. Hans trone omfatter himlene og jorden, og å bevare dem tretter Ham ikke. Han er Den Opphøyde, Den Veldige.',
    source: "Koranen 2:255. Etter bønnen: an-Nasa'i, as-Sunan al-Kubra 9848",
  },
  {
    id: 'muawwidhat',
    category: 'after-salah',
    title: 'De tre siste surene',
    arabic:
      'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\nقُلْ هُوَ اللَّهُ أَحَدٌ ﴿١﴾ اللَّهُ الصَّمَدُ ﴿٢﴾ لَمْ يَلِدْ وَلَمْ يُولَدْ ﴿٣﴾ وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ ﴿٤﴾\n\nبِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\nقُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ﴿١﴾ مِنْ شَرِّ مَا خَلَقَ ﴿٢﴾ وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ ﴿٣﴾ وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ﴿٤﴾ وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ ﴿٥﴾\n\nبِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\nقُلْ أَعُوذُ بِرَبِّ النَّاسِ ﴿١﴾ مَلِكِ النَّاسِ ﴿٢﴾ إِلَٰهِ النَّاسِ ﴿٣﴾ مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ﴿٤﴾ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ﴿٥﴾ مِنَ الْجِنَّةِ وَالنَّاسِ ﴿٦﴾',
    transliteration:
      "Qul huwallahu ahad. Allahus-samad. Lam yalid wa lam yulad. Wa lam yakul-lahu kufuwan ahad.\n\nQul a'udhu bi-rabbil-falaq. Min sharri ma khalaq. Wa min sharri ghasiqin idha waqab. Wa min sharrin-naffathati fil-'uqad. Wa min sharri hasidin idha hasad.\n\nQul a'udhu bi-rabbin-nas. Malikin-nas. Ilahin-nas. Min sharril-waswasil-khannas. Alladhi yuwaswisu fi sudurin-nas. Minal-jinnati wan-nas.",
    meaning:
      'Al-Ikhlas: Si: Han er Allah, Den Ene. Allah, Den alle trenger. Han har ikke fått barn og er ikke født. Og ingen er Hans like.\n\nAl-Falaq: Si: Jeg søker tilflukt hos morgengryets Herre, mot ondskapen i det Han har skapt, mot ondskapen i mørket når det senker seg, mot ondskapen hos dem som blåser på knuter, og mot ondskapen hos den misunnelige når han misunner.\n\nAn-Nas: Si: Jeg søker tilflukt hos menneskenes Herre, menneskenes Konge, menneskenes Gud, mot ondskapen hos hviskeren som trekker seg unna, han som hvisker i menneskenes bryst, blant jinn og mennesker.',
    note: 'Leses én gang etter hver bønn.',
    source: "Koranen 112-114. Etter bønnen: Sunan Abi Dawud 1523, Jami' at-Tirmidhi 2903",
  },
  {
    id: 'help-me-remember',
    category: 'after-salah',
    title: 'Hjelp meg å minnes Deg',
    arabic: 'اللَّهُمَّ أَعِنِّي عَلَىٰ ذِكْرِكَ، وَشُكْرِكَ، وَحُسْنِ عِبَادَتِكَ',
    transliteration: "Allahumma a'inni 'ala dhikrika, wa shukrika, wa husni 'ibadatik",
    meaning: 'Allah, hjelp meg å minnes Deg, å takke Deg og å tilbe Deg på best mulig måte.',
    source: 'Sunan Abi Dawud 1522',
  },
  {
    id: 'iftar',
    category: 'ramadan',
    title: 'Dua ved iftar',
    arabic: 'ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ وَثَبَتَ الْأَجْرُ إِنْ شَاءَ اللَّهُ',
    transliteration: "Dhahabaz-zama'u wabtallatil-'uruqu wa thabatal-ajru in sha' Allah",
    meaning: 'Tørsten er borte, årene er fuktet, og lønnen er sikret, om Allah vil.',
    note: 'Sies når du bryter fasten.',
    source: 'Sunan Abi Dawud 2357',
  },
  {
    id: 'laylat-al-qadr',
    category: 'ramadan',
    title: 'Dua for Laylat-ul-Qadr',
    arabic: 'اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي',
    transliteration: "Allahumma innaka 'afuwwun tuhibbul-'afwa fa'fu 'anni",
    meaning: 'Allah, Du er Den som tilgir, og Du elsker å tilgi, så tilgi meg.',
    note: 'Profeten lærte Aisha å si denne duaen.',
    source: "Jami' at-Tirmidhi 3513, Sunan Ibn Majah 3850",
  },
  {
    id: 'i-am-fasting',
    category: 'ramadan',
    title: 'Når noen provoserer deg',
    arabic: 'إِنِّي صَائِمٌ',
    transliteration: "Inni sa'im",
    meaning: 'Jeg faster.',
    note: 'Sies hvis noen krangler med deg eller fornærmer deg mens du faster.',
    source: 'Sahih al-Bukhari 1904',
  },
  {
    id: 'iftar-as-guest',
    category: 'ramadan',
    title: 'Når du bryter fasten hos andre',
    arabic:
      'أَفْطَرَ عِنْدَكُمُ الصَّائِمُونَ، وَأَكَلَ طَعَامَكُمُ الْأَبْرَارُ، وَصَلَّتْ عَلَيْكُمُ الْمَلَائِكَةُ',
    transliteration:
      "Aftara 'indakumus-sa'imun, wa akala ta'amakumul-abrar, wa sallat 'alaykumul-mala'ikah",
    meaning:
      'Må de fastende bryte fasten hos dere, må de rettskafne spise maten deres, og må englene be for dere.',
    source: 'Sunan Abi Dawud 3854',
  },
  {
    id: 'talbiyah',
    category: 'hajj',
    title: 'Talbiyah',
    arabic:
      'لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيكَ لَكَ',
    transliteration:
      "Labbayk Allahumma labbayk, labbayka la sharika laka labbayk, innal-hamda wan-ni'mata laka wal-mulk, la sharika lak",
    meaning:
      'Her er jeg, Allah, her er jeg. Her er jeg, Du har ingen partner, her er jeg. All lovprisning og all nåde tilhører Deg, og herredømmet. Du har ingen partner.',
    note: 'Sies av pilegrimer fra de går i ihram til de kaster steiner på Eid-dagen.',
    source: 'Sahih al-Bukhari 1549, Sahih Muslim 1184',
  },
  {
    id: 'arafah',
    category: 'hajj',
    title: 'Den beste duaen på Arafah-dagen',
    arabic:
      'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
    transliteration:
      "La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamd, wa huwa 'ala kulli shay'in qadir",
    meaning:
      'Ingen har rett til å tilbes unntatt Allah alene, uten partner. Herredømmet og all lovprisning tilhører Ham, og Han har makt over alle ting.',
    note: 'Profeten sa at den beste duaen er duaen på Arafah-dagen, og at dette er det beste han og profetene før ham har sagt.',
    source: "Jami' at-Tirmidhi 3585",
  },
  {
    id: 'takbir-dhul-hijjah',
    category: 'hajj',
    title: 'Takbir i Dhul-Hijjah',
    arabic:
      'اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، لَا إِلَٰهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، وَلِلَّهِ الْحَمْدُ',
    transliteration: 'Allahu akbar, Allahu akbar, la ilaha illallah, wallahu akbar, Allahu akbar, wa lillahil-hamd',
    meaning:
      'Allah er størst, Allah er størst, ingen har rett til å tilbes unntatt Allah. Allah er størst, Allah er størst, og all lovprisning tilhører Allah.',
    note: 'Sies ofte de ti første dagene, og etter bønnene fra Arafah-dagen til og med 13. Dhul-Hijjah.',
    source: 'Musannaf Ibn Abi Shaybah, fra Abdullah ibn Masud',
  },
  {
    id: 'between-the-corners',
    category: 'hajj',
    title: 'Mellom Rukn al-Yamani og Den svarte steinen',
    arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
    transliteration: "Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina 'adhaban-nar",
    meaning: 'Vår Herre, gi oss det gode i dette livet og det gode i det neste, og vern oss mot straffen i Ilden.',
    note: 'Sies under tawaf, på strekningen mellom de to hjørnene av Kaba.',
    source: 'Sunan Abi Dawud 1892. Koranen 2:201',
  },
  {
    id: 'qurbani',
    category: 'hajj',
    title: 'Når du slakter qurbani',
    arabic: 'بِسْمِ اللَّهِ وَاللَّهُ أَكْبَرُ',
    transliteration: 'Bismillahi wallahu akbar',
    meaning: 'I Allahs navn, og Allah er størst.',
    source: 'Sahih Muslim 1966',
  },
];

export function duasIn(category: DuaCategoryId): Dua[] {
  return DUAS.filter((dua) => dua.category === category);
}

export function duaById(id: string): Dua | null {
  return DUAS.find((dua) => dua.id === id) ?? null;
}

export function categoryById(id: string): DuaCategory | null {
  return DUA_CATEGORIES.find((category) => category.id === id) ?? null;
}
