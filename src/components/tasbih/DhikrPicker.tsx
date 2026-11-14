import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Icon, type IconName } from '@/components/icons';
import { ArabicText } from '@/components/duas/ArabicText';
import { AppText, Button, Sheet, TextField } from '@/components/ui';
import { t, tCount } from '@/lib/i18n';
import {
  DHIKR,
  DHIKR_CATEGORIES,
  DHIKR_IDS,
  DHIKR_INFO,
  dhikrIn,
  searchDhikr,
  type DhikrCategory,
  type DhikrId,
} from '@/lib/tasbih';
import { useTasbihStore } from '@/store/tasbih';
import { useTheme } from '@/theme';
import { opacity, radius, spacing } from '@/theme/tokens';
import { Chip } from './Chip';

type Filter = 'all' | 'short' | 'added' | 'recent';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: t('tasbih.filterAll') },
  { value: 'short', label: t('tasbih.filterShort') },
  { value: 'added', label: t('tasbih.filterAdded') },
  { value: 'recent', label: t('tasbih.filterRecent') },
];

const CATEGORY_ICONS: Record<DhikrCategory, IconName> = {
  'after-prayer': 'mosque',
  'morning-evening': 'cloud-sun',
  sleep: 'moon-stars',
  protection: 'shield-check',
  forgiveness: 'arrow-u-up-left',
  praise: 'sparkle',
  worry: 'heart',
  quran: 'book-open',
};

const NAMES = Object.fromEntries(DHIKR_IDS.map((id) => [id, t(`tasbih.names.${id}`)])) as Record<DhikrId, string>;
const CATEGORY_NAMES = Object.fromEntries(
  DHIKR_CATEGORIES.map((id) => [id, t(`tasbih.categories.${id}`)]),
) as Record<DhikrCategory, string>;

function CategoryTile({ category, onPress }: { category: DhikrCategory; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        flexBasis: '47%',
        flexGrow: 1,
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        opacity: pressed ? opacity.pressed : 1,
      })}>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: radius.full,
          backgroundColor: theme.colors.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Icon name={CATEGORY_ICONS[category]} size={20} color={theme.colors.primary} />
      </View>
      <AppText size="sm" weight="semibold" numberOfLines={2}>
        {CATEGORY_NAMES[category]}
      </AppText>
    </Pressable>
  );
}

function DhikrRow({
  id,
  selected,
  label,
  onToggle,
}: {
  id: DhikrId;
  selected: boolean;
  label?: string;
  onToggle: () => void;
}) {
  const theme = useTheme();
  const meaning = DHIKR[id].meaning;
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        gap: spacing.md,
        padding: spacing.md,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: selected ? theme.colors.primary : theme.colors.border,
        backgroundColor: selected ? theme.colors.primarySoft : 'transparent',
        opacity: pressed ? opacity.pressed : 1,
      })}>
      <View style={{ flex: 1, gap: spacing.xs }}>
        {label ? (
          <AppText size="xs" tone="textMuted">
            {label}
          </AppText>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm }}>
          <AppText weight="semibold" style={{ flex: 1 }}>
            {NAMES[id]}
          </AppText>
          <AppText size="sm" tone="textMuted" tabular>
            {t('tasbih.times', { count: DHIKR_INFO[id].count })}
          </AppText>
        </View>
        <ArabicText>{DHIKR[id].arabic}</ArabicText>
        {meaning ? (
          <AppText size="sm" tone="textSecondary">
            {meaning}
          </AppText>
        ) : null}
      </View>
      <Icon
        name={selected ? 'check-circle' : 'plus-circle'}
        size={24}
        weight={selected ? 'fill' : 'regular'}
        color={selected ? theme.colors.primary : theme.colors.textMuted}
      />
    </Pressable>
  );
}

export function DhikrPicker({
  visible,
  added,
  onClose,
  onAdd,
}: {
  visible: boolean;
  added: DhikrId[];
  onClose: () => void;
  onAdd: (ids: DhikrId[]) => void;
}) {
  const theme = useTheme();
  const recent = useTasbihStore((store) => store.recent);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [category, setCategory] = useState<DhikrCategory | null>(null);
  const [selected, setSelected] = useState<DhikrId[]>([]);

  const close = () => {
    setQuery('');
    setFilter('all');
    setCategory(null);
    setSelected([]);
    onClose();
  };
  const toggle = (id: DhikrId) =>
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  const rows = (ids: DhikrId[], labelled = false) =>
    ids.map((id) => (
      <DhikrRow
        key={id}
        id={id}
        selected={selected.includes(id)}
        label={labelled ? DHIKR_INFO[id].categories.map((c) => CATEGORY_NAMES[c]).join(' · ') : undefined}
        onToggle={() => toggle(id)}
      />
    ));

  const searching = query.trim().length > 0;
  const hits = searching ? searchDhikr(query, NAMES, CATEGORY_NAMES) : [];
  const filtered: DhikrId[] =
    filter === 'short'
      ? DHIKR_IDS.filter((id) => DHIKR_INFO[id].short)
      : filter === 'added'
        ? DHIKR_IDS.filter((id) => added.includes(id))
        : filter === 'recent'
          ? recent
          : [];

  const content = category ? (
    <View style={{ gap: spacing.sm }}>
      <Pressable
        onPress={() => setCategory(null)}
        accessibilityRole="button"
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          minHeight: 36,
          opacity: pressed ? opacity.pressed : 1,
        })}>
        <Icon name="caret-left" size={18} color={theme.colors.primary} />
        <AppText weight="semibold" tone="primary">
          {t('tasbih.back')}
        </AppText>
      </Pressable>
      {rows(dhikrIn(category))}
    </View>
  ) : (
    <View style={{ gap: spacing.md }}>
      <TextField
        value={query}
        onChangeText={setQuery}
        placeholder={t('tasbih.searchDhikr')}
        accessibilityLabel={t('tasbih.searchDhikr')}
        autoCorrect={false}
        returnKeyType="search"
      />
      {searching ? (
        <View style={{ gap: spacing.sm }}>
          <AppText size="sm" tone="textMuted">
            {hits.length > 0 ? tCount('tasbih.hits', hits.length) : t('tasbih.noResults')}
          </AppText>
          {rows(hits, true)}
        </View>
      ) : (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
            {FILTERS.map((item) => (
              <Chip key={item.value} label={item.label} selected={filter === item.value} onPress={() => setFilter(item.value)} />
            ))}
          </View>
          {filter === 'all' ? (
            <View style={{ gap: spacing.sm }}>
              <AppText size="sm" weight="semibold" tone="textMuted">
                {t('tasbih.categoriesTitle')}
              </AppText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {DHIKR_CATEGORIES.map((item) => (
                  <CategoryTile key={item} category={item} onPress={() => setCategory(item)} />
                ))}
              </View>
            </View>
          ) : (
            <View style={{ gap: spacing.sm }}>
              {filtered.length > 0 ? (
                rows(filtered)
              ) : (
                <AppText size="sm" tone="textMuted">
                  {t('tasbih.noResults')}
                </AppText>
              )}
            </View>
          )}
        </>
      )}
    </View>
  );

  return (
    <Sheet
      visible={visible}
      onClose={close}
      title={category ? CATEGORY_NAMES[category] : t('tasbih.addDhikr')}
      footer={
        selected.length > 0 ? (
          <Button
            label={t('tasbih.addCount', { count: selected.length })}
            onPress={() => {
              onAdd(selected);
              close();
            }}
          />
        ) : null
      }>
      {content}
    </Sheet>
  );
}
