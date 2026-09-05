import type { Term } from './halalText';

export type RuleSeverity = 'avoid' | 'uncertain';

export type HalalRule = {
  id: string;
  severity: RuleSeverity;
  label: string;
  reason: string;
  terms: Term[];
  negatedBy?: Term[];
};

function word(...texts: string[]): Term[] {
  return texts.map((text) => ({ text, match: 'word' as const }));
}

function compound(...texts: string[]): Term[] {
  return texts.map((text) => ({ text, match: 'compound' as const }));
}

const VEGETARIAN_CLAIM = word(
  'vegansk',
  'vegetarisk',
  'vegan',
  'vegetarian',
  'plantebasert',
  'plant based',
);

export const HALAL_RULES: HalalRule[] = [
  {
    id: 'pork',
    severity: 'avoid',
    label: 'Svin',
    reason:
      'Ingredienslisten oppgir svin eller et produkt av svin. Dette regnes som forbudt av alle lærde.',
    terms: [
      ...compound('svin', 'flesk'),
      ...word('bacon', 'skinke', 'pork', 'ham', 'lard', 'pork fat', 'pork gelatine'),
    ],
  },
  {
    id: 'alcohol-drink',
    severity: 'avoid',
    label: 'Drikkbar alkohol',
    reason:
      'Ingredienslisten oppgir en alkoholholdig drikk som ingrediens. Dette regnes som forbudt av alle lærde.',
    terms: word(
      'vin',
      'rødvin',
      'hvitvin',
      'øl',
      'likør',
      'konjakk',
      'whisky',
      'vodka',
      'sherry',
      'wine',
      'red wine',
      'white wine',
      'beer',
      'liqueur',
      'brandy',
      'alkoholholdig',
    ),
    negatedBy: word('alkoholfri', 'alcohol free', 'uten alkohol', 'vineddik', 'wine vinegar'),
  },
  {
    id: 'e542',
    severity: 'avoid',
    label: 'E542 benfosfat',
    reason: 'E542 er benfosfat og lages av knokler fra dyr. Det finnes ingen plantebasert variant.',
    terms: [...word('e542', 'benfosfat', 'bone phosphate', 'edible bone phosphate'), ...compound('benmel')],
  },
  {
    id: 'gelatin',
    severity: 'uncertain',
    label: 'Gelatin',
    reason:
      'Gelatin kan komme fra svin, storfe eller fisk. Norske pakninger oppgir sjelden kilden, og vi gjetter ikke.',
    terms: compound('gelatin', 'gelatine'),
    negatedBy: [...word('gelatinfri', 'gelatin free'), ...VEGETARIAN_CLAIM],
  },
  {
    id: 'e441',
    severity: 'uncertain',
    label: 'E441',
    reason: 'E441 er E-nummeret for gelatin. Kilden er ikke oppgitt.',
    terms: word('e441'),
  },
  {
    id: 'e120-karmin',
    severity: 'uncertain',
    label: 'E120 karmin',
    reason:
      'E120 karmin utvinnes av koknilje-insekter. Lærde er uenige om insektfarge er tillatt, så vi tar ikke stilling.',
    terms: [
      ...word('e120', 'karmin', 'carmine', 'cochineal', 'koknilje'),
      ...compound('karminsyre', 'karminrød'),
    ],
  },
  {
    id: 'e471',
    severity: 'uncertain',
    label: 'E471 mono- og diglyserider',
    reason: 'E471 kan lages av planteolje eller av animalsk fett. Pakningen oppgir aldri hvilken.',
    terms: word('e471'),
  },
  {
    id: 'mono-diglyserider',
    severity: 'uncertain',
    label: 'Mono- og diglyserider',
    reason:
      'Mono- og diglyserider av fettsyrer kan være animalske. E472a til E472f hører til samme familie.',
    terms: [
      ...word('e472a', 'e472b', 'e472c', 'e472d', 'e472e', 'e472f'),
      ...compound('glyserider', 'glycerides'),
    ],
  },
  {
    id: 'e904-shellac',
    severity: 'uncertain',
    label: 'E904 shellak',
    reason:
      'E904 shellak er harpiks fra lakkskjoldlus. Lærde er uenige om insektharpiks er tillatt.',
    terms: word('e904', 'shellak', 'shellac', 'skjellakk'),
  },
  {
    id: 'e920-cystein',
    severity: 'uncertain',
    label: 'E920 L-cystein',
    reason:
      'E920 L-cystein har historisk blitt laget av fjær og hår. Nyere varianter lages ofte ved gjæring, men kilden er ikke oppgitt.',
    terms: [...word('e920', 'l cystein', 'l cysteine'), ...compound('cystein', 'cysteine')],
  },
  {
    id: 'rennet',
    severity: 'uncertain',
    label: 'Løpe',
    reason:
      'Løpe kan være animalsk eller mikrobiell. Animalsk løpe fra dyr som ikke er slaktet halal er omstridt blant lærde.',
    terms: [...compound('løpe'), ...word('rennet', 'chymosin', 'kymosin')],
    negatedBy: word('mikrobiell løpe', 'microbial rennet', 'vegetabilsk løpe'),
  },
  {
    id: 'alcohol-carrier',
    severity: 'uncertain',
    label: 'Alkohol eller etanol',
    reason:
      'Alkohol er oppført. Mange lærde tillater alkohol som bærer eller løsemiddel i aroma, men ingredienslisten skiller ikke det fra drikkbar alkohol.',
    terms: word('alkohol', 'etanol', 'ethanol', 'alcohol', 'ethyl alcohol', 'etylalkohol'),
    negatedBy: word('alkoholfri', 'alcohol free', 'uten alkohol', 'etanolfri'),
  },
  {
    id: 'animal-fat',
    severity: 'uncertain',
    label: 'Animalsk fett',
    reason: 'Animalsk fett er oppført uten at dyreslag eller slaktemåte er oppgitt.',
    terms: [
      ...word('animalsk fett', 'dyrefett', 'ister', 'animal fat', 'beef fat', 'suet', 'animalsk olje'),
      ...compound('talg', 'tallow', 'storfefett', 'kjøttfett'),
    ],
  },
  {
    id: 'whey',
    severity: 'uncertain',
    label: 'Myse',
    reason:
      'Myse er et biprodukt av osteproduksjon. Er osten laget med animalsk løpe, arver mysen den samme usikkerheten.',
    terms: [...compound('myse'), ...word('whey', 'whey powder', 'mysepulver')],
  },
  {
    id: 'aroma',
    severity: 'uncertain',
    label: 'Aroma',
    reason:
      'Aroma er en samlebetegnelse. Den kan inneholde animalske råvarer eller alkohol som bærer uten at det står på pakningen.',
    terms: word('aroma', 'aromaer', 'naturlig aroma', 'aromas', 'flavouring', 'flavoring'),
  },
  {
    id: 'emulgator-ukjent',
    severity: 'uncertain',
    label: 'Emulgator uten kilde',
    reason:
      'Emulgator er oppgitt uten E-nummer eller kilde. Emulgatorer kan være både animalske og plantebaserte.',
    terms: word('emulgator', 'emulgatorer', 'emulgeringsmiddel', 'emulsifier'),
  },
  {
    id: 'enzymes',
    severity: 'uncertain',
    label: 'Enzymer',
    reason: 'Enzymer kan være mikrobielle eller hentet fra dyr. Kilden er ikke oppgitt.',
    terms: word('enzym', 'enzymer', 'enzymes', 'enzyme', 'lipase', 'pepsin'),
  },
];
