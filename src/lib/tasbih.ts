import { duaById } from './duas.ts';
import { t } from './i18n.ts';

export type TasbihPhrase = {
  arabic: string;
  transliteration: string;
  meaning: string;
};

export const DHIKR_IDS = [
  'subhanallah',
  'alhamdulillah',
  'allahu-akbar',
  'astaghfirullah',
  'tahlil',
  'la-ilaha-illallah',
  'subhanallahi-wa-bihamdih',
  'subhanallahil-azim',
  'salawat',
  'la-hawla',
  'astaghfirullah-wa-atubu',
  'hasbunallah',
  'yunus',
  'bismillah-protection',
  'audhu-bikalimat',
  'bismika-amutu',
  'rabbana-atina',
] as const;
export type DhikrId = (typeof DHIKR_IDS)[number];

export const DHIKR_CATEGORIES = [
  'after-prayer',
  'morning-evening',
  'sleep',
  'protection',
  'forgiveness',
  'praise',
  'worry',
  'quran',
] as const;
export type DhikrCategory = (typeof DHIKR_CATEGORIES)[number];

export type DhikrInfo = {
  count: number;
  short: boolean;
  categories: DhikrCategory[];
  source: string;
};

export const FREE_DHIKR: DhikrId[] = ['subhanallah', 'alhamdulillah', 'allahu-akbar', 'astaghfirullah', 'la-ilaha-illallah'];

export type TasbihStep = { dhikr: DhikrId; target: number };
export type TasbihSeries = { id: string; name: string; steps: TasbihStep[] };

export type TasbihGoal = number | null;

export type TasbihState = {
  series: string;
  step: number;
  count: number;
  goal: TasbihGoal;
  done: boolean;
};

export type TasbihTapResult = 'count' | 'lap' | 'step' | 'done';

export const BEADS_PER_ROUND = 33;
export const FREE_ID = 'free';
export const AFTER_PRAYER_ID = 'after-prayer';
export const GOAL_PRESETS = [33, 99, 100] as const;
export const MAX_TARGET = 9999;

function lines(text: string | undefined): string[] {
  return (text ?? '').split('\n');
}

function phrase(arabic = '', transliteration = '', meaning = ''): TasbihPhrase {
  return { arabic, transliteration, meaning };
}

const tasbih = duaById('tasbih');
const arabic = lines(tasbih?.arabic);
const transliteration = lines(tasbih?.transliteration);
const meaning = lines(tasbih?.meaning);
const istighfar = duaById('istighfar');
const completion = duaById('tasbih-completion');

export const COMPLETION_DUA_ID = completion?.id ?? null;

function own(id: DhikrId, arabicText: string, latin: string): TasbihPhrase {
  return phrase(arabicText, latin, t(`tasbih.meanings.${id}` as 'tasbih.meanings.salawat'));
}

export const DHIKR: Record<DhikrId, TasbihPhrase> = {
  subhanallah: phrase(arabic[0], transliteration[0], meaning[0]),
  alhamdulillah: phrase(arabic[1], transliteration[1], meaning[1]),
  'allahu-akbar': phrase(arabic[2], transliteration[2], meaning[2]),
  astaghfirullah: phrase(istighfar?.arabic, istighfar?.transliteration, istighfar?.meaning),
  tahlil: phrase(completion?.arabic, completion?.transliteration, completion?.meaning),
  'la-ilaha-illallah': own('la-ilaha-illallah', 'لَا إِلَٰهَ إِلَّا اللَّهُ', 'La ilaha illallah'),
  'subhanallahi-wa-bihamdih': own('subhanallahi-wa-bihamdih', 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ', 'Subhanallahi wa bihamdih'),
  'subhanallahil-azim': own(
    'subhanallahil-azim',
    'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ',
    "Subhanallahi wa bihamdih, subhanallahil-'azim",
  ),
  salawat: own('salawat', 'اللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ', "Allahumma salli 'ala Muhammad"),
  'la-hawla': own('la-hawla', 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', 'La hawla wa la quwwata illa billah'),
  'astaghfirullah-wa-atubu': own('astaghfirullah-wa-atubu', 'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ', 'Astaghfirullaha wa atubu ilayh'),
  hasbunallah: own('hasbunallah', 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ', "Hasbunallahu wa ni'mal-wakil"),
  yunus: own(
    'yunus',
    'لَا إِلَٰهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ',
    'La ilaha illa anta subhanaka inni kuntu minaz-zalimin',
  ),
  'bismillah-protection': own(
    'bismillah-protection',
    'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
    "Bismillahil-ladhi la yadurru ma'asmihi shay'un fil-ardi wa la fis-sama'i wa huwas-sami'ul-'alim",
  ),
  'audhu-bikalimat': own(
    'audhu-bikalimat',
    'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
    "A'udhu bikalimatillahit-tammati min sharri ma khalaq",
  ),
  'bismika-amutu': own('bismika-amutu', 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا', 'Bismika Allahumma amutu wa ahya'),
  'rabbana-atina': own(
    'rabbana-atina',
    'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
    "Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina 'adhaban-nar",
  ),
};

function info(count: number, categories: DhikrCategory[], source: string, short = false): DhikrInfo {
  return { count, short, categories, source };
}

export const DHIKR_INFO: Record<DhikrId, DhikrInfo> = {
  subhanallah: info(33, ['after-prayer', 'sleep', 'praise'], 'Sahih Muslim 597', true),
  alhamdulillah: info(33, ['after-prayer', 'sleep', 'praise'], 'Sahih Muslim 597', true),
  'allahu-akbar': info(33, ['after-prayer', 'sleep', 'praise'], 'Sahih Muslim 597', true),
  astaghfirullah: info(100, ['after-prayer', 'forgiveness'], 'Sahih Muslim 591', true),
  tahlil: info(1, ['after-prayer'], 'Sahih Muslim 597'),
  'la-ilaha-illallah': info(100, ['praise', 'morning-evening'], 'Jami at-Tirmidhi 3383', true),
  'subhanallahi-wa-bihamdih': info(100, ['morning-evening', 'praise'], 'Sahih Muslim 2692', true),
  'subhanallahil-azim': info(33, ['praise'], 'Sahih al-Bukhari 6406'),
  salawat: info(10, ['morning-evening', 'praise'], 'Sahih Muslim 408', true),
  'la-hawla': info(10, ['worry', 'morning-evening'], 'Sahih al-Bukhari 6384', true),
  'astaghfirullah-wa-atubu': info(100, ['forgiveness', 'morning-evening'], 'Sahih Muslim 2702', true),
  hasbunallah: info(33, ['worry', 'quran'], 'Al-Imran 3:173', true),
  yunus: info(33, ['worry', 'forgiveness', 'quran'], 'Al-Anbiya 21:87'),
  'bismillah-protection': info(3, ['protection', 'morning-evening'], 'Sunan Abi Dawud 5088'),
  'audhu-bikalimat': info(3, ['protection', 'morning-evening'], 'Sahih Muslim 2709'),
  'bismika-amutu': info(1, ['sleep'], 'Sahih al-Bukhari 6324'),
  'rabbana-atina': info(1, ['quran'], 'Al-Baqarah 2:201'),
};

export function dhikrIn(category: DhikrCategory): DhikrId[] {
  return DHIKR_IDS.filter((id) => DHIKR_INFO[id].categories.includes(category));
}

export function searchDhikr(query: string, names: Record<DhikrId, string>, categoryNames: Record<DhikrCategory, string>): DhikrId[] {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return [];
  return DHIKR_IDS.filter((id) =>
    [names[id], DHIKR[id].transliteration, DHIKR[id].meaning, DHIKR[id].arabic, ...DHIKR_INFO[id].categories.map((c) => categoryNames[c])]
      .some((text) => text.toLocaleLowerCase().includes(needle)),
  );
}

export const AFTER_PRAYER_STEPS: TasbihStep[] = [
  { dhikr: 'subhanallah', target: 33 },
  { dhikr: 'alhamdulillah', target: 33 },
  { dhikr: 'allahu-akbar', target: 33 },
  { dhikr: 'tahlil', target: 1 },
];

export function isDhikrId(value: unknown): value is DhikrId {
  return typeof value === 'string' && (DHIKR_IDS as readonly string[]).includes(value);
}

export function clampTarget(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(Math.max(Math.round(value), 1), MAX_TARGET);
}

export function initialTasbih(series: string = FREE_ID, goal: TasbihGoal = 33): TasbihState {
  return { series, step: 0, count: 0, goal, done: false };
}

export function isFree(state: TasbihState): boolean {
  return state.series === FREE_ID;
}

export function currentStep(state: TasbihState, steps: TasbihStep[]): TasbihStep | null {
  if (isFree(state)) return null;
  return steps[Math.min(state.step, steps.length - 1)] ?? null;
}

export function targetOf(state: TasbihState, steps: TasbihStep[]): number | null {
  if (isFree(state)) return state.goal;
  return currentStep(state, steps)?.target ?? null;
}

export function dhikrOf(state: TasbihState, steps: TasbihStep[], freeDhikr: DhikrId | null = null): DhikrId | null {
  if (isFree(state)) return freeDhikr;
  return currentStep(state, steps)?.dhikr ?? null;
}

export function phraseOf(state: TasbihState, steps: TasbihStep[], freeDhikr: DhikrId | null = null): TasbihPhrase | null {
  const id = dhikrOf(state, steps, freeDhikr);
  return id ? DHIKR[id] : null;
}

export function totalKey(state: TasbihState, steps: TasbihStep[], freeDhikr: DhikrId | null = null): string {
  return dhikrOf(state, steps, freeDhikr) ?? FREE_ID;
}

export function ringBeads(target: number | null): number {
  return target !== null && target >= 10 && target <= BEADS_PER_ROUND ? target : BEADS_PER_ROUND;
}

export type RingKind = 'once' | 'arcs' | 'beads';

export function ringKind(target: number | null): RingKind {
  if (target === 1) return 'once';
  if (target !== null && target < 10) return 'arcs';
  return 'beads';
}

export function beadsFilled(state: TasbihState, target: number | null): number {
  const beads = ringBeads(target);
  if (state.done) return beads;
  if (target !== null && target <= BEADS_PER_ROUND) return Math.min(state.count, beads);
  return state.count % BEADS_PER_ROUND;
}

export function seriesTotal(steps: TasbihStep[]): number {
  return steps.reduce((sum, step) => sum + step.target, 0);
}

export function stepFractions(state: TasbihState, steps: TasbihStep[]): number[] {
  return steps.map((step, index) => {
    if (state.done || index < state.step) return 1;
    if (index > state.step) return 0;
    return Math.min(state.count / step.target, 1);
  });
}

export function jumpTo(state: TasbihState, step: number, steps: TasbihStep[]): TasbihState {
  if (isFree(state) || step < 0 || step >= steps.length) return state;
  return { ...state, step, count: 0, done: false };
}

export function advance(state: TasbihState, steps: TasbihStep[]): { next: TasbihState; result: TasbihTapResult } {
  if (state.done) return { next: state, result: 'count' };
  const count = state.count + 1;
  const lap = count % BEADS_PER_ROUND === 0;

  if (isFree(state)) {
    const reachedGoal = state.goal !== null && count === state.goal;
    return {
      next: { ...state, count, done: reachedGoal },
      result: reachedGoal ? 'done' : lap ? 'lap' : 'count',
    };
  }

  const target = targetOf(state, steps);
  if (target === null) return { next: { ...state, done: true }, result: 'done' };
  if (count < target) return { next: { ...state, count }, result: lap ? 'lap' : 'count' };
  if (state.step < steps.length - 1) {
    return { next: { ...state, step: state.step + 1, count: 0 }, result: 'step' };
  }
  return { next: { ...state, count, done: true }, result: 'done' };
}

export function linkedParts(value: TasbihPhrase): { arabic: string[]; transliteration: string[] } | null {
  const arabicParts = value.arabic.split('،').map((part) => part.trim()).filter(Boolean);
  const latinParts = value.transliteration.split(',').map((part) => part.trim()).filter(Boolean);
  if (arabicParts.length < 2 || arabicParts.length !== latinParts.length) return null;
  return { arabic: arabicParts, transliteration: latinParts };
}
