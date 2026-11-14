import { useState } from 'react';
import { View } from 'react-native';
import { AppText, SegmentedControl, Sheet, TextField, Toggle } from '@/components/ui';
import { isRTL, language, t } from '@/lib/i18n';
import { DHIKR_IDS, FREE_ID, GOAL_PRESETS, clampTarget, isFree, type TasbihGoal } from '@/lib/tasbih';
import { useSettings } from '@/store/settings';
import { useTasbihStore } from '@/store/tasbih';
import { spacing } from '@/theme/tokens';
import type { TasbihSession } from './useTasbih';

type GoalOption = '33' | '99' | '100' | 'none' | 'custom';

function optionOf(goal: TasbihGoal): GoalOption {
  if (goal === null) return 'none';
  return (GOAL_PRESETS as readonly number[]).includes(goal) ? (String(goal) as GoalOption) : 'custom';
}

const GOAL_OPTIONS: { value: GoalOption; label: string }[] = [
  ...GOAL_PRESETS.map((goal) => ({ value: String(goal) as GoalOption, label: String(goal) })),
  { value: 'none', label: '∞' },
  { value: 'custom', label: t('tasbih.custom') },
];

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
  const { state, setGoal, totals } = session;
  const [customOpen, setCustomOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const option = customOpen ? 'custom' : optionOf(state.goal);
  const showTransliteration = useSettings((store) => store.duaShowTransliteration);
  const setShowTransliteration = useSettings((store) => store.setDuaShowTransliteration);
  const showMeaning = useSettings((store) => store.duaShowMeaning);
  const setShowMeaning = useSettings((store) => store.setDuaShowMeaning);
  const colorLinked = useTasbihStore((store) => store.colorLinked);
  const setColorLinked = useTasbihStore((store) => store.setColorLinked);
  const counted = [...DHIKR_IDS, FREE_ID].filter((key) => (totals[key] ?? 0) > 0);

  return (
    <Sheet visible={visible} onClose={onClose} title={t('tasbih.settings')}>
      <View style={{ gap: spacing.lg }}>
        {isFree(state) ? (
          <View style={{ gap: spacing.sm }}>
            <AppText size="sm" weight="semibold" tone="textMuted">
              {t('tasbih.goal')}
            </AppText>
            <SegmentedControl
              value={option}
              options={GOAL_OPTIONS}
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
          <AppText size="sm" weight="semibold" tone="textMuted">
            {t('tasbih.show')}
          </AppText>
          {!isRTL() ? (
            <ToggleRow label={t('tasbih.pronunciation')} value={showTransliteration} onChange={setShowTransliteration} />
          ) : null}
          {language() !== 'ar' ? (
            <ToggleRow label={t('tasbih.translation')} value={showMeaning} onChange={setShowMeaning} />
          ) : null}
          <ToggleRow label={t('tasbih.colorLinked')} value={colorLinked} onChange={setColorLinked} />
        </View>
        {counted.length > 0 ? (
          <View style={{ gap: spacing.xs }}>
            <AppText size="sm" weight="semibold" tone="textMuted">
              {t('tasbih.totals')}
            </AppText>
            {counted.map((key) => (
              <View key={key} style={{ flexDirection: 'row', justifyContent: 'space-between', minHeight: 32 }}>
                <AppText>{key === FREE_ID ? t('tasbih.freeCount') : t(`tasbih.names.${key}` as 'tasbih.names.tahlil')}</AppText>
                <AppText tone="textMuted" tabular>
                  {totals[key]}
                </AppText>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </Sheet>
  );
}
