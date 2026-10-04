import { View } from 'react-native';
import { DuaCard } from '@/components/duas/DuaCard';
import { AppText, Card, Divider, ListRow, Screen, SegmentedControl, Toggle } from '@/components/ui';
import { duaById } from '@/lib/duas';
import { useSettings } from '@/store/settings';
import {
  arabicFonts,
  arabicSizes,
  spacing,
  type ArabicFontKey,
  type ArabicSizeKey,
} from '@/theme/tokens';

const EXAMPLE = duaById('anta-as-salam');

const FONTS = (Object.keys(arabicFonts) as ArabicFontKey[]).map((key) => ({
  value: key,
  label: arabicFonts[key].label,
}));

const SIZES = (Object.keys(arabicSizes) as ArabicSizeKey[]).map((key) => ({
  value: key,
  label: arabicSizes[key].label,
}));

const ROW = { paddingHorizontal: spacing.md } as const;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
      <AppText size="sm" weight="semibold" tone="textSecondary">
        {label}
      </AppText>
      {children}
    </View>
  );
}

export default function DuaSettingsScreen() {
  const font = useSettings((state) => state.duaArabicFont);
  const setFont = useSettings((state) => state.setDuaArabicFont);
  const size = useSettings((state) => state.duaArabicSize);
  const setSize = useSettings((state) => state.setDuaArabicSize);
  const showTransliteration = useSettings((state) => state.duaShowTransliteration);
  const setShowTransliteration = useSettings((state) => state.setDuaShowTransliteration);
  const showMeaning = useSettings((state) => state.duaShowMeaning);
  const setShowMeaning = useSettings((state) => state.setDuaShowMeaning);

  return (
    <Screen scroll edges={[]}>
      <View style={{ gap: spacing.lg, marginTop: spacing.lg, marginBottom: spacing.xl }}>
        {EXAMPLE ? <DuaCard dua={EXAMPLE} /> : null}

        <Card padding="sm" rounded="xl">
          <Field label="Arabisk skrift">
            <SegmentedControl value={font} options={FONTS} onChange={setFont} />
          </Field>
          <Field label="Tekststørrelse">
            <SegmentedControl value={size} options={SIZES} onChange={setSize} />
          </Field>
          <Divider />
          <ListRow
            title="Uttale"
            trailing={
              <Toggle
                value={showTransliteration}
                onValueChange={setShowTransliteration}
                accessibilityLabel="Uttale"
              />
            }
            style={ROW}
          />
          <Divider />
          <ListRow
            title="Norsk oversettelse"
            trailing={
              <Toggle
                value={showMeaning}
                onValueChange={setShowMeaning}
                accessibilityLabel="Norsk oversettelse"
              />
            }
            style={ROW}
          />
        </Card>
      </View>
    </Screen>
  );
}
