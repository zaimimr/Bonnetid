export const FEATURE_IDS = ['calendar', 'qibla', 'mosques', 'jumuah', 'duas', 'tasbih', 'tracker'] as const;

export type FeatureId = (typeof FEATURE_IDS)[number];

export const MAX_TAB_SLOTS = 3;
export const DEFAULT_TAB_SLOTS: FeatureId[] = ['calendar', 'qibla', 'jumuah'];
export const PREVIOUS_DEFAULT_TAB_SLOTS: FeatureId[][] = [
  ['calendar', 'qibla'],
  ['calendar', 'qibla', 'mosques'],
];

export const MAX_SHORTCUTS = 4;
export const DEFAULT_SHORTCUTS: FeatureId[] = ['duas', 'tasbih', 'jumuah', 'tracker'];
export const PREVIOUS_DEFAULT_SHORTCUTS: FeatureId[] = ['jumuah', 'tasbih', 'duas', 'mosques'];

export const HOME_BLOCK_IDS = [
  'next-prayer',
  'shortcuts',
  'after-prayer',
  'announcement',
  'season',
  'night',
  'prayer-times',
  'special-days',
] as const;

export type HomeBlockId = (typeof HOME_BLOCK_IDS)[number];

export type HomeBlock = { id: HomeBlockId; visible: boolean };

export const LOCKED_HOME_BLOCKS: readonly HomeBlockId[] = ['next-prayer', 'prayer-times'];

export const ASIDE_HOME_BLOCKS: readonly HomeBlockId[] = ['prayer-times', 'special-days'];

export const DEFAULT_HOME_LAYOUT: HomeBlock[] = HOME_BLOCK_IDS.map((id) => ({ id, visible: true }));

function isFeatureId(id: unknown): id is FeatureId {
  return (FEATURE_IDS as readonly unknown[]).includes(id);
}

function isHomeBlockId(id: unknown): id is HomeBlockId {
  return (HOME_BLOCK_IDS as readonly unknown[]).includes(id);
}

export function normalizeSlots(slots: unknown, max: number, fallback: FeatureId[]): FeatureId[] {
  if (!Array.isArray(slots)) return fallback;
  return [...new Set(slots.filter(isFeatureId))].slice(0, max);
}

export function upgradeDefault(slots: FeatureId[], previous: FeatureId[], next: FeatureId[]): FeatureId[] {
  const untouched = slots.length === previous.length && slots.every((id, index) => id === previous[index]);
  return untouched ? next : slots;
}

export function toggleSlot(slots: FeatureId[], id: FeatureId, max: number): FeatureId[] {
  if (slots.includes(id)) return slots.filter((slot) => slot !== id);
  if (slots.length >= max) return slots;
  return [...slots, id];
}

export function normalizeHomeLayout(layout: unknown): HomeBlock[] {
  const blocks = Array.isArray(layout) ? layout : [];
  const seen = new Set<HomeBlockId>();
  const result: HomeBlock[] = [];
  for (const block of blocks) {
    const id = (block as Partial<HomeBlock> | null)?.id;
    if (!isHomeBlockId(id) || seen.has(id)) continue;
    seen.add(id);
    const visible = LOCKED_HOME_BLOCKS.includes(id) || (block as HomeBlock).visible !== false;
    result.push({ id, visible });
  }
  for (const id of HOME_BLOCK_IDS) {
    if (!seen.has(id)) result.push({ id, visible: true });
  }
  return result;
}

export function orderHomeBlocks(layout: HomeBlock[], visibleIds: HomeBlockId[]): HomeBlock[] {
  const shown = visibleIds.filter((id) => layout.some((block) => block.id === id && block.visible));
  return [
    ...shown.map((id) => ({ id, visible: true })),
    ...layout.filter((block) => !shown.includes(block.id)),
  ];
}

export function addHomeBlock(layout: HomeBlock[], id: HomeBlockId): HomeBlock[] {
  const shown = layout.filter((block) => block.visible && block.id !== id);
  const hidden = layout.filter((block) => !block.visible && block.id !== id);
  return [...shown, { id, visible: true }, ...hidden];
}

export function setHomeBlockVisible(
  layout: HomeBlock[],
  id: HomeBlockId,
  visible: boolean,
): HomeBlock[] {
  if (LOCKED_HOME_BLOCKS.includes(id)) return layout;
  return layout.map((block) => (block.id === id ? { ...block, visible } : block));
}
