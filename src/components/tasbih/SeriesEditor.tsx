import { useRef, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import Sortable from 'react-native-sortables';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/icons';
import { ArabicText } from '@/components/duas/ArabicText';
import { AppText, Button, Card, SegmentedControl, TextField } from '@/components/ui';
import { t } from '@/lib/i18n';
import { DHIKR, DHIKR_INFO, GOAL_PRESETS, clampTarget, type DhikrId, type TasbihSeries } from '@/lib/tasbih';
import { useTasbihStore } from '@/store/tasbih';
import { useTheme } from '@/theme';
import { hitSlop, radius, spacing } from '@/theme/tokens';
import { DashedButton } from './DashedButton';
import { DhikrPicker } from './DhikrPicker';

type DraftStep = { key: string; dhikr: DhikrId; target: number };
type TargetOption = '33' | '99' | '100' | 'custom';

function targetOptions(custom: number | null): { value: TargetOption; label: string }[] {
  return [
    ...GOAL_PRESETS.map((goal) => ({ value: String(goal) as TargetOption, label: String(goal) })),
    { value: 'custom', label: custom === null ? t('tasbih.custom') : String(custom) },
  ];
}

function HeaderText({ label, onPress, disabled, bold }: { label: string; onPress: () => void; disabled?: boolean; bold?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} hitSlop={hitSlop} accessibilityRole="button" style={{ paddingHorizontal: 6 }}>
      <AppText weight={bold ? 'semibold' : 'regular'} tone={disabled ? 'textMuted' : 'primary'}>
        {label}
      </AppText>
    </Pressable>
  );
}

function StepCard({
  index,
  step,
  onChange,
  onRemove,
}: {
  index: number;
  step: DraftStep;
  onChange: (target: number) => void;
  onRemove: () => void;
}) {
  const theme = useTheme();
  const preset = (GOAL_PRESETS as readonly number[]).includes(step.target);
  const [custom, setCustom] = useState(!preset);
  const name = t(`tasbih.names.${step.dhikr}`);

  return (
    <Card rounded="xl" style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <View
          style={{
            width: 26,
            height: 26,
            borderRadius: radius.full,
            backgroundColor: theme.colors.primarySoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <AppText size="sm" weight="semibold" tone="primary" tabular>
            {index + 1}
          </AppText>
        </View>
        <AppText weight="semibold" style={{ flex: 1 }} numberOfLines={2}>
          {name}
        </AppText>
        <Pressable
          onPress={onRemove}
          hitSlop={hitSlop}
          accessibilityRole="button"
          accessibilityLabel={`${t('tasbih.remove')}: ${name}`}>
          <Icon name="minus-circle" size={22} color={theme.colors.danger} weight="fill" />
        </Pressable>
        <Sortable.Handle>
          <View accessibilityLabel={`${t('tasbih.move')}: ${name}`} style={{ padding: spacing.xs }}>
            <Icon name="dots-six-vertical" size={22} color={theme.colors.textMuted} />
          </View>
        </Sortable.Handle>
      </View>
      <ArabicText>{DHIKR[step.dhikr].arabic}</ArabicText>
      <SegmentedControl
        value={custom ? 'custom' : (String(step.target) as TargetOption)}
        options={targetOptions(custom ? step.target : null)}
        onChange={(value) => {
          setCustom(value === 'custom');
          if (value !== 'custom') onChange(Number(value));
        }}
      />
      {custom ? (
        <TextField
          defaultValue={String(step.target)}
          onChangeText={(text) => {
            const digits = text.replace(/\D/g, '');
            if (digits) onChange(clampTarget(Number(digits)));
          }}
          keyboardType="number-pad"
          placeholder={t('tasbih.amount')}
          accessibilityLabel={t('tasbih.amount')}
          maxLength={4}
        />
      ) : null}
    </Card>
  );
}

export function SeriesEditor({ id }: { id?: string }) {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const existing = useTasbihStore((store) => store.series.find((item) => item.id === id) ?? null);
  const saveSeries = useTasbihStore((store) => store.saveSeries);
  const deleteSeries = useTasbihStore((store) => store.deleteSeries);
  const nextKey = useRef(0);
  const keyed = (dhikr: DhikrId, target: number): DraftStep => ({ key: String(nextKey.current++), dhikr, target });
  const [name, setName] = useState(existing?.name ?? '');
  const [steps, setSteps] = useState<DraftStep[]>(() =>
    (existing?.steps ?? []).map((step, index) => ({ key: `initial-${index}`, ...step })),
  );
  const [adding, setAdding] = useState(false);
  const markRecent = useTasbihStore((store) => store.markRecent);

  const save = () => {
    const series: TasbihSeries = {
      id: existing?.id ?? `s${Date.now().toString(36)}`,
      name: name.trim() || t('tasbih.newSeries'),
      steps: steps.map(({ dhikr, target }) => ({ dhikr, target })),
    };
    saveSeries(series);
    router.back();
  };

  const confirmDelete = (series: TasbihSeries) =>
    Alert.alert(t('tasbih.deleteConfirm', { name: series.name }), undefined, [
      { text: t('tasbih.cancel'), style: 'cancel' },
      {
        text: t('tasbih.delete'),
        style: 'destructive',
        onPress: () => {
          deleteSeries(series.id);
          router.back();
        },
      },
    ]);

  return (
    <>
      <Stack.Screen
        options={{
          title: existing ? t('tasbih.editSeries') : t('tasbih.newSeries'),
          headerLeft: () => <HeaderText label={t('tasbih.cancel')} onPress={() => router.back()} />,
          headerRight: () => <HeaderText label={t('tasbih.save')} onPress={save} disabled={steps.length === 0} bold />,
        }}
      />
      <Animated.ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: insets.bottom + spacing.xl,
          gap: spacing.lg,
        }}
        style={{ backgroundColor: theme.colors.background }}>
        <View style={{ gap: spacing.sm }}>
          <AppText size="sm" weight="semibold" tone="textMuted">
            {t('tasbih.name')}
          </AppText>
          <TextField
            value={name}
            onChangeText={setName}
            placeholder={t('tasbih.newSeries')}
            accessibilityLabel={t('tasbih.name')}
            maxLength={40}
          />
        </View>
        <Sortable.Grid
          columns={1}
          data={steps}
          keyExtractor={(step) => step.key}
          rowGap={spacing.md}
          customHandle
          hapticsEnabled
          scrollableRef={scrollRef}
          onDragEnd={({ data }) => setSteps(data)}
          renderItem={({ item, index }) => (
            <StepCard
              index={index}
              step={item}
              onChange={(target) =>
                setSteps((current) => current.map((step) => (step.key === item.key ? { ...step, target } : step)))
              }
              onRemove={() => setSteps((current) => current.filter((step) => step.key !== item.key))}
            />
          )}
        />
        <DashedButton label={t('tasbih.addDhikr')} onPress={() => setAdding(true)} />
        {existing ? (
          <Button label={t('tasbih.deleteSeries')} variant="ghost" onPress={() => confirmDelete(existing)} />
        ) : null}
      </Animated.ScrollView>
      <DhikrPicker
        visible={adding}
        added={steps.map((step) => step.dhikr)}
        onClose={() => setAdding(false)}
        onAdd={(ids) => {
          markRecent(ids);
          setSteps((current) => [...current, ...ids.map((dhikr) => keyed(dhikr, DHIKR_INFO[dhikr].count))]);
        }}
      />
    </>
  );
}
