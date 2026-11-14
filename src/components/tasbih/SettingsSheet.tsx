import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText, ListRow, SegmentedControl, Sheet, TextField, Toggle } from '@/components/ui';
import { isRTL, language, t } from '@/lib/i18n';
import { AFTER_PRAYER_ID, FREE_DHIKR, GOAL_PRESETS, clampTarget, isFree, type TasbihGoal } from '@/lib/tasbih';
import { useSettings } from '@/store/settings';
import { useTasbihStore } from '@/store/tasbih';
import { spacing } from '@/theme/tokens';
import { Chip } from './Chip';
import type { TasbihSession } from './useTasbih';

type GoalOption = '33' | '99' | '100' | 'none' | 'custom';

function optionOf(goal: TasbihGoal): GoalOption {
  if (goal === null) return 'none';
  return (GOAL_PRESETS as readonly number[]).includes(goal) ? (String(goal) as GoalOption) : 'custom';
}

function goalOptions(goal: TasbihGoal): { value: GoalOption; label: string }[] {
  const custom = goal !== null && optionOf(goal) === 'custom' ? String(goal) : t('tasbih.custom');
  return [
    ...GOAL_PRESETS.map((preset) => ({ value: String(preset) as GoalOption, label: String(preset) })),
    { value: 'none', label: '∞' },
    { value: 'custom', label: custom },
  ];
}

function Caption({ children }: { children: string }) {
  return (
    <AppText size="sm" weight="semibold" tone="textMuted">
      {children}
    </AppText>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
      <AppText>{label}</AppText>
      <Toggle value={value} onValueChange={onChange} accessibilityLabel={label} />
    </View>
  );
}

export function SettingsSheet({
  session,
  visible,
  onClose,
}: {
  session: TasbihSession;
  visible: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { state, setGoal, series, dhikr, total, setFreeDhikr } = session;
  const free = isFree(state);
  const editable = !free && series !== null && series.id !== AFTER_PRAYER_ID;
  const [customOpen, setCustomOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const option = customOpen ? 'custom' : optionOf(state.goal);
  const showTransliteration = useSettings((store) => store.duaShowTransliteration);
  const setShowTransliteration = useSettings((store) => store.setDuaShowTransliteration);
  const showMeaning = useSettings((store) => store.duaShowMeaning);
  const setShowMeaning = useSettings((store) => store.setDuaShowMeaning);
  const colorLinked = useTasbihStore((store) => store.colorLinked);
  const setColorLinked = useTasbihStore((store) => store.setColorLinked);

  return (
    <Sheet visible={visible} onClose={onClose} title={t('tasbih.settings')}>
      <View style={{ gap: spacing.lg }}>
        {free ? (
          <View style={{ gap: spacing.sm }}>
            <Caption>{t('tasbih.dhikr')}</Caption>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
              {FREE_DHIKR.map((id) => (
                <Chip key={id} label={t(`tasbih.names.${id}`)} selected={id === dhikr} onPress={() => setFreeDhikr(id)} />
              ))}
            </View>
          </View>
        ) : null}
        {free ? (
          <View style={{ gap: spacing.sm }}>
            <Caption>{t('tasbih.goal')}</Caption>
            <SegmentedControl
              value={option}
              options={goalOptions(state.goal)}
              onChange={(value) => {
                if (value === 'custom') {
                  setCustomOpen(true);
                  setDraft(state.goal === null ? '' : String(state.goal));
                  return;
                }
                setCustomOpen(false);
                setGoal(value === 'none' ? null : Number(value));
              }}
            />
            {option === 'custom' ? (
              <TextField
                value={customOpen ? draft : String(state.goal ?? '')}
                onChangeText={(text) => {
                  const digits = text.replace(/\D/g, '');
                  setCustomOpen(true);
                  setDraft(digits);
                  if (digits) setGoal(clampTarget(Number(digits)));
                }}
                keyboardType="number-pad"
                placeholder={t('tasbih.amount')}
                accessibilityLabel={t('tasbih.amount')}
                maxLength={4}
              />
            ) : null}
          </View>
        ) : null}
        <View style={{ gap: spacing.xs }}>
          <Caption>{t('tasbih.show')}</Caption>
          {!isRTL() ? (
            <ToggleRow label={t('tasbih.pronunciation')} value={showTransliteration} onChange={setShowTransliteration} />
          ) : null}
          {language() !== 'ar' ? (
            <ToggleRow label={t('tasbih.translation')} value={showMeaning} onChange={setShowMeaning} />
          ) : null}
          <ToggleRow label={t('tasbih.colorLinked')} value={colorLinked} onChange={setColorLinked} />
        </View>
        <View style={{ gap: spacing.xs }}>
          <Caption>{t('tasbih.allTime')}</Caption>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', minHeight: 32 }}>
            <AppText>{dhikr ? t(`tasbih.names.${dhikr}`) : t('tasbih.freeCount')}</AppText>
            <AppText tone="textMuted" tabular>
              {total}
            </AppText>
          </View>
        </View>
        {editable ? (
          <ListRow
            title={t('tasbih.editSeries')}
            chevron
            onPress={() => {
              onClose();
              router.push({ pathname: '/tasbih-series', params: { id: series.id } });
            }}
          />
        ) : null}
      </View>
    </Sheet>
  );
}
