export type DuaCategoryId = 'after-adhan' | 'after-salah' | 'morning-evening' | 'ramadan' | 'everyday';

export type DuaCategory = {
  id: DuaCategoryId;
  title: string;
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
  { id: 'after-adhan', title: 'Etter adhan' },
  { id: 'after-salah', title: 'Etter bønnen' },
  { id: 'morning-evening', title: 'Morgen og kveld' },
  { id: 'ramadan', title: 'Ramadan' },
  { id: 'everyday', title: 'Hverdag' },
];

export const DUA_LINKS = {
  afterSalah: 'after-salah',
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
    id: 'after-adhan',
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
    title: 'Ingen gud uten Allah',
    arabic:
      'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ، اللَّهُمَّ لَا مَانِعَ لِمَا أَعْطَيْتَ، وَلَا مُعْطِيَ لِمَا مَنَعْتَ، وَلَا يَنْفَعُ ذَا الْجَدِّ مِنْكَ الْجَدُّ',
    transliteration:
      "La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamdu wa huwa 'ala kulli shay'in qadir. Allahumma la mani'a lima a'tayta, wa la mu'tiya lima mana'ta, wa la yanfa'u dhal-jaddi minkal-jadd",
    meaning:
      'Ingen har rett til å tilbes unntatt Allah alene, uten partner. Hans er herredømmet og Hans er lovprisningen, og Han har makt over alle ting. Allah, ingen kan holde tilbake det Du gir, og ingen kan gi det Du holder tilbake. Rikdom og status hjelper ingen mot Deg.',
    source: 'Sahih al-Bukhari 844, Sahih Muslim 593',
  },
  {
    id: 'subhanallah-33',
    category: 'after-salah',
    title: 'Subhanallah',
    arabic: 'سُبْحَانَ اللَّهِ',
    transliteration: 'Subhanallah',
    meaning: 'Allah er hevet over alle mangler.',
    repeat: 33,
    source: 'Sahih Muslim 597',
  },
  {
    id: 'alhamdulillah-33',
    category: 'after-salah',
    title: 'Alhamdulillah',
    arabic: 'الْحَمْدُ لِلَّهِ',
    transliteration: 'Alhamdulillah',
    meaning: 'All lovprisning tilhører Allah.',
    repeat: 33,
    source: 'Sahih Muslim 597',
  },
  {
    id: 'allahu-akbar-33',
    category: 'after-salah',
    title: 'Allahu akbar',
    arabic: 'اللَّهُ أَكْبَرُ',
    transliteration: 'Allahu akbar',
    meaning: 'Allah er størst.',
    repeat: 33,
    source: 'Sahih Muslim 597',
  },
  {
    id: 'tasbih-completion',
    category: 'after-salah',
    title: 'Fullfør hundre',
    arabic:
      'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
    transliteration:
      "La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamdu wa huwa 'ala kulli shay'in qadir",
    meaning:
      'Ingen har rett til å tilbes unntatt Allah alene, uten partner. Hans er herredømmet og Hans er lovprisningen, og Han har makt over alle ting.',
    note: 'Sies én gang etter de tre gangene 33, så det blir hundre til sammen.',
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
    title: 'Hjelp meg å minnes deg',
    arabic: 'اللَّهُمَّ أَعِنِّي عَلَىٰ ذِكْرِكَ، وَشُكْرِكَ، وَحُسْنِ عِبَادَتِكَ',
    transliteration: "Allahumma a'inni 'ala dhikrika, wa shukrika, wa husni 'ibadatik",
    meaning: 'Allah, hjelp meg å minnes Deg, å takke Deg og å tilbe Deg på best mulig måte.',
    source: 'Sunan Abi Dawud 1522',
  },
  {
    id: 'sayyid-al-istighfar',
    category: 'morning-evening',
    title: 'Sayyid al-istighfar',
    arabic:
      'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَٰهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَىٰ عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي، فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
    transliteration:
      "Allahumma anta rabbi la ilaha illa ant, khalaqtani wa ana 'abduk, wa ana 'ala 'ahdika wa wa'dika mastata't, a'udhu bika min sharri ma sana't, abu'u laka bi-ni'matika 'alayy, wa abu'u bi-dhanbi faghfir li, fa-innahu la yaghfirudh-dhunuba illa ant",
    meaning:
      'Allah, Du er min Herre. Ingen har rett til å tilbes unntatt Deg. Du skapte meg, og jeg er Din tjener. Jeg holder meg til min pakt og mitt løfte til Deg så godt jeg kan. Jeg søker tilflukt hos Deg mot det onde jeg har gjort. Jeg erkjenner Din nåde mot meg, og jeg erkjenner min synd, så tilgi meg. For ingen tilgir synder unntatt Deg.',
    note: 'Den beste formen for å be om tilgivelse. Sies morgen og kveld.',
    source: 'Sahih al-Bukhari 6306',
  },
  {
    id: 'morning-kingdom',
    category: 'morning-evening',
    title: 'Vi har nådd morgenen',
    arabic:
      'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ، رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَٰذَا الْيَوْمِ وَخَيْرَ مَا بَعْدَهُ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَٰذَا الْيَوْمِ وَشَرِّ مَا بَعْدَهُ، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ',
    transliteration:
      "Asbahna wa asbahal-mulku lillah, wal-hamdu lillah, la ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamdu wa huwa 'ala kulli shay'in qadir. Rabbi as'aluka khayra ma fi hadhal-yawmi wa khayra ma ba'dah, wa a'udhu bika min sharri ma fi hadhal-yawmi wa sharri ma ba'dah. Rabbi a'udhu bika minal-kasali wa su'il-kibar. Rabbi a'udhu bika min 'adhabin fin-nari wa 'adhabin fil-qabr",
    meaning:
      'Vi har nådd morgenen, og herredømmet tilhører Allah. All lovprisning tilhører Allah. Ingen har rett til å tilbes unntatt Allah alene, uten partner. Hans er herredømmet og Hans er lovprisningen, og Han har makt over alle ting. Herre, jeg ber Deg om det gode i denne dagen og det som kommer etter, og søker tilflukt hos Deg mot det onde i denne dagen og det som kommer etter. Herre, jeg søker tilflukt hos Deg mot latskap og en vond alderdom. Herre, jeg søker tilflukt hos Deg mot straffen i Ilden og straffen i graven.',
    note: 'Om kvelden sier du «amsayna wa amsal-mulku lillah» og «hadhihil-laylah» (denne natten) i stedet for «hadhal-yawm».',
    source: 'Sahih Muslim 2723',
  },
  {
    id: 'bika-asbahna',
    category: 'morning-evening',
    title: 'Med deg når vi morgenen',
    arabic:
      'اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ',
    transliteration:
      'Allahumma bika asbahna, wa bika amsayna, wa bika nahya, wa bika namutu, wa ilaykan-nushur',
    meaning:
      'Allah, ved Deg har vi nådd morgenen og ved Deg har vi nådd kvelden. Ved Deg lever vi og ved Deg dør vi, og til Deg er oppstandelsen.',
    note: 'Om kvelden: «Allahumma bika amsayna, wa bika asbahna, wa bika nahya, wa bika namutu, wa ilaykal-masir» (og til Deg er hjemkomsten).',
    source: "Jami' at-Tirmidhi 3391, Sunan Abi Dawud 5068",
  },
  {
    id: 'bismillah-no-harm',
    category: 'morning-evening',
    title: 'I Allahs navn, intet skader',
    arabic:
      'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
    transliteration:
      "Bismillahil-ladhi la yadurru ma'as-mihi shay'un fil-ardi wa la fis-sama'i wa huwas-sami'ul-'alim",
    meaning:
      'I Allahs navn, Han som gjør at ingenting på jorden eller i himmelen kan skade når Hans navn er nevnt. Han er Den Allhørende, Den Allvitende.',
    repeat: 3,
    source: "Sunan Abi Dawud 5088, Jami' at-Tirmidhi 3388",
  },
  {
    id: 'subhanallah-wa-bihamdihi',
    category: 'morning-evening',
    title: 'Subhanallah wa bihamdihi',
    arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
    transliteration: 'Subhanallahi wa bi-hamdih',
    meaning: 'Allah er hevet over alle mangler, og all lovprisning er Hans.',
    repeat: 100,
    source: 'Sahih Muslim 2692',
  },
  {
    id: 'perfect-words',
    category: 'morning-evening',
    title: 'Allahs fullkomne ord',
    arabic: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
    transliteration: "A'udhu bi-kalimatillahit-tammati min sharri ma khalaq",
    meaning: 'Jeg søker tilflukt i Allahs fullkomne ord mot ondskapen i det Han har skapt.',
    note: 'Sies om kvelden.',
    repeat: 3,
    source: 'Sahih Muslim 2708, 2709',
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
    note: 'Profeten lærte Aisha denne duaen for Laylat-ul-Qadr.',
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
    id: 'before-eating',
    category: 'everyday',
    title: 'Før maten',
    arabic: 'بِسْمِ اللَّهِ',
    transliteration: 'Bismillah',
    meaning: 'I Allahs navn.',
    note: 'Glemte du det i starten, sier du «Bismillahi awwalahu wa akhirah» (i Allahs navn, i begynnelsen og slutten).',
    source: "Sunan Abi Dawud 3767, Jami' at-Tirmidhi 1858",
  },
  {
    id: 'after-eating',
    category: 'everyday',
    title: 'Etter maten',
    arabic:
      'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَٰذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ',
    transliteration:
      "Alhamdu lillahil-ladhi at'amani hadha wa razaqanihi min ghayri hawlin minni wa la quwwah",
    meaning:
      'All lovprisning tilhører Allah, som ga meg dette å spise og sørget for det uten noen kraft eller styrke fra meg.',
    source: "Sunan Abi Dawud 4023, Jami' at-Tirmidhi 3458",
  },
  {
    id: 'before-sleep',
    category: 'everyday',
    title: 'Før du sovner',
    arabic: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',
    transliteration: 'Bismika Allahumma amutu wa ahya',
    meaning: 'I Ditt navn, Allah, dør jeg og lever jeg.',
    source: 'Sahih al-Bukhari 6324',
  },
  {
    id: 'waking-up',
    category: 'everyday',
    title: 'Når du våkner',
    arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ',
    transliteration: "Alhamdu lillahil-ladhi ahyana ba'da ma amatana wa ilayhin-nushur",
    meaning: 'All lovprisning tilhører Allah, som ga oss liv etter å ha latt oss dø, og til Ham er oppstandelsen.',
    source: 'Sahih al-Bukhari 6324',
  },
  {
    id: 'leaving-home',
    category: 'everyday',
    title: 'Når du går ut',
    arabic: 'بِسْمِ اللَّهِ، تَوَكَّلْتُ عَلَى اللَّهِ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    transliteration: "Bismillah, tawakkaltu 'alallah, wa la hawla wa la quwwata illa billah",
    meaning:
      'I Allahs navn. Jeg setter min lit til Allah, og det finnes ingen kraft og ingen styrke unntatt hos Allah.',
    source: "Sunan Abi Dawud 5095, Jami' at-Tirmidhi 3426",
  },
  {
    id: 'entering-home',
    category: 'everyday',
    title: 'Når du kommer hjem',
    arabic: 'بِسْمِ اللَّهِ',
    transliteration: 'Bismillah',
    meaning: 'I Allahs navn.',
    note: 'Nevn Allahs navn når du går inn og når du spiser, så får ikke Shaytan verken husly eller mat hos deg.',
    source: 'Sahih Muslim 2018',
  },
  {
    id: 'entering-mosque',
    category: 'everyday',
    title: 'Når du går inn i moskeen',
    arabic: 'اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ',
    transliteration: 'Allahummaf-tah li abwaba rahmatik',
    meaning: 'Allah, åpne dørene til Din nåde for meg.',
    source: 'Sahih Muslim 713',
  },
  {
    id: 'leaving-mosque',
    category: 'everyday',
    title: 'Når du går ut av moskeen',
    arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ',
    transliteration: "Allahumma inni as'aluka min fadlik",
    meaning: 'Allah, jeg ber Deg om Din gavmildhet.',
    source: 'Sahih Muslim 713',
  },
  {
    id: 'after-wudu',
    category: 'everyday',
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
    id: 'travel',
    category: 'everyday',
    title: 'Når du reiser',
    arabic:
      'اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَٰذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ، وَإِنَّا إِلَىٰ رَبِّنَا لَمُنْقَلِبُونَ، اللَّهُمَّ إِنَّا نَسْأَلُكَ فِي سَفَرِنَا هَٰذَا الْبِرَّ وَالتَّقْوَىٰ، وَمِنَ الْعَمَلِ مَا تَرْضَىٰ، اللَّهُمَّ هَوِّنْ عَلَيْنَا سَفَرَنَا هَٰذَا وَاطْوِ عَنَّا بُعْدَهُ، اللَّهُمَّ أَنْتَ الصَّاحِبُ فِي السَّفَرِ، وَالْخَلِيفَةُ فِي الْأَهْلِ، اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ وَعْثَاءِ السَّفَرِ، وَكَآبَةِ الْمَنْظَرِ، وَسُوءِ الْمُنْقَلَبِ فِي الْمَالِ وَالْأَهْلِ',
    transliteration:
      "Allahu akbar, Allahu akbar, Allahu akbar. Subhanal-ladhi sakhkhara lana hadha wa ma kunna lahu muqrinin, wa inna ila rabbina la-munqalibun. Allahumma inna nas'aluka fi safarina hadhal-birra wat-taqwa, wa minal-'amali ma tarda. Allahumma hawwin 'alayna safarana hadha watwi 'anna bu'dah. Allahumma antas-sahibu fis-safar, wal-khalifatu fil-ahl. Allahumma inni a'udhu bika min wa'tha'is-safar, wa ka'abatil-manzar, wa su'il-munqalabi fil-mali wal-ahl",
    meaning:
      'Allah er størst (tre ganger). Hevet over alle mangler er Han som har gjort dette tjenlig for oss, noe vi ikke selv kunne ha klart, og til vår Herre skal vi vende tilbake. Allah, vi ber Deg om godhet og gudsfrykt på denne reisen, og om handlinger som behager Deg. Allah, gjør denne reisen lett for oss og korte ned avstanden. Allah, Du er følgesvennen på reisen og den som tar vare på familien. Allah, jeg søker tilflukt hos Deg mot reisens strabaser, mot triste syn og mot å komme hjem til skade på eiendom eller familie.',
    source: 'Sahih Muslim 1342',
  },
  {
    id: 'entering-toilet',
    category: 'everyday',
    title: 'Før toalettet',
    arabic: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْخُبُثِ وَالْخَبَائِثِ',
    transliteration: "Allahumma inni a'udhu bika minal-khubuthi wal-khaba'ith",
    meaning: 'Allah, jeg søker tilflukt hos Deg mot onde vesener, både hankjønn og hunkjønn.',
    source: 'Sahih al-Bukhari 142, Sahih Muslim 375',
  },
  {
    id: 'leaving-toilet',
    category: 'everyday',
    title: 'Etter toalettet',
    arabic: 'غُفْرَانَكَ',
    transliteration: 'Ghufranak',
    meaning: 'Jeg ber om Din tilgivelse.',
    source: "Sunan Abi Dawud 30, Jami' at-Tirmidhi 7",
  },
  {
    id: 'sneezing',
    category: 'everyday',
    title: 'Når noen nyser',
    arabic: 'الْحَمْدُ لِلَّهِ\nيَرْحَمُكَ اللَّهُ\nيَهْدِيكُمُ اللَّهُ وَيُصْلِحُ بَالَكُمْ',
    transliteration: 'Alhamdulillah\nYarhamukallah\nYahdikumullahu wa yuslihu balakum',
    meaning:
      'Den som nyser sier: All lovprisning tilhører Allah.\nDen som hører det svarer: Må Allah vise deg nåde.\nDen som nyste svarer: Må Allah veilede dere og gjøre det godt for dere.',
    source: 'Sahih al-Bukhari 6224',
  },
  {
    id: 'distress',
    category: 'everyday',
    title: 'I vanskelige stunder',
    arabic:
      'لَا إِلَٰهَ إِلَّا اللَّهُ الْعَظِيمُ الْحَلِيمُ، لَا إِلَٰهَ إِلَّا اللَّهُ رَبُّ الْعَرْشِ الْعَظِيمِ، لَا إِلَٰهَ إِلَّا اللَّهُ رَبُّ السَّمَاوَاتِ وَرَبُّ الْأَرْضِ وَرَبُّ الْعَرْشِ الْكَرِيمِ',
    transliteration:
      "La ilaha illallahul-'azimul-halim. La ilaha illallahu rabbul-'arshil-'azim. La ilaha illallahu rabbus-samawati wa rabbul-ardi wa rabbul-'arshil-karim",
    meaning:
      'Ingen har rett til å tilbes unntatt Allah, Den Veldige, Den Tålmodige. Ingen har rett til å tilbes unntatt Allah, Herre over den veldige tronen. Ingen har rett til å tilbes unntatt Allah, Herre over himlene, Herre over jorden og Herre over den edle tronen.',
    source: 'Sahih al-Bukhari 6346, Sahih Muslim 2730',
  },
  {
    id: 'rabbana-atina',
    category: 'everyday',
    title: 'Rabbana atina',
    arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
    transliteration: "Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina 'adhaban-nar",
    meaning: 'Vår Herre, gi oss det gode i dette livet og det gode i det neste, og vern oss mot straffen i Ilden.',
    note: 'Den duaen Profeten ba oftest.',
    source: 'Koranen 2:201. Sahih al-Bukhari 6389',
  },
  {
    id: 'visiting-sick',
    category: 'everyday',
    title: 'Når du besøker en syk',
    arabic: 'لَا بَأْسَ، طَهُورٌ إِنْ شَاءَ اللَّهُ',
    transliteration: "La ba's, tahurun in sha' Allah",
    meaning: 'Det går bra. Det renser deg, om Allah vil.',
    source: 'Sahih al-Bukhari 3616',
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
