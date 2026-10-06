import { t } from './i18n.ts';

export type HijriMeta = {
  monthNames: Map<number, string>;
  monthStartNames: Map<number, string>;
  yearlyEvents: Map<string, string>;
};

const MONTHS = Object.entries(t('hijri.months', { returnObjects: true }));

export const HIJRI_META: HijriMeta = {
  monthNames: new Map(MONTHS.map(([month, { name }]) => [Number(month), name])),
  monthStartNames: new Map(MONTHS.map(([month, { start }]) => [Number(month), start])),
  yearlyEvents: new Map(Object.entries(t('hijri.yearlyEvents', { returnObjects: true }))),
};
