export const FEATURE_FLAGS = ['duas', 'tasbih', 'mosque-donation', 'qibla-ar', 'prayer-tracker'] as const;

export type FeatureFlag = (typeof FEATURE_FLAGS)[number];

export function flagEnabled(value: boolean | string | undefined): boolean {
  return value !== false;
}
