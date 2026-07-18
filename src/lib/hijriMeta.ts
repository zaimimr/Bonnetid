export type HijriMeta = {
  monthNames: Map<number, string>;
  monthStartNames: Map<number, string>;
  yearlyEvents: Map<string, string>;
};

const MONTHS: [number, string, string][] = [
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
];

const YEARLY_EVENTS: [number, number, string][] = [
  [1, 10, '10. MUHARRAM – AASHARA'],
  [3, 12, '12. Rabi al-Awal – Mawlid an-Nabi (Profetens fødselsdag)'],
  [7, 27, '27. Rajab – Shab-e-Miraj (Isra-natten)'],
  [8, 15, "15. Sha'ban – Laylat-ul-Barat (Tilgivelsesnatten)"],
  [9, 21, '21. Ramadan – Siste Ashra (3. Ashra)'],
  [9, 27, '27. Ramadan – Laylat-ul-Qadr (Skjebnenatten)'],
  [12, 9, '9. Dhul-Hijja – Arafah'],
  [12, 10, '10. Dhul-Hijja – Eid al-Adha'],
];

export const HIJRI_META: HijriMeta = {
  monthNames: new Map(MONTHS.map(([month, nameLong]) => [month, nameLong])),
  monthStartNames: new Map(MONTHS.map(([month, , no]) => [month, no])),
  yearlyEvents: new Map(YEARLY_EVENTS.map(([month, day, no]) => [`${month}-${day}`, no])),
};
