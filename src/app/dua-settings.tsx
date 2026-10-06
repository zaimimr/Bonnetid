import { View } from 'react-native';
import { DuaCard } from '@/components/duas/DuaCard';
import { AppText, Card, Divider, ListRow, Screen, SegmentedControl, Toggle } from '@/components/ui';
import { duaById } from '@/lib/duas';
import { language, t } from '@/lib/i18n';
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

const PRONUNCIATION = t('settings.pronunciation');
const TRANSLATION = t('settings.englishTranslation');

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
  const showPronunciationSetting = language() !== 'ar' && language() !== 'ur';
  const showMeaningSetting = language() !== 'ar';

  return (
    <Screen scroll edges={[]}>
      <View style={{ gap: spacing.lg, marginTop: spacing.lg, marginBottom: spacing.xl }}>
        {EXAMPLE ? <DuaCard dua={EXAMPLE} /> : null}

        <Card padding="sm" rounded="xl">
          <Field label={t('settings.arabicScript')}>
            <SegmentedControl value={font} options={FONTS} onChange={setFont} />
          </Field>
          <Field label={t('settings.textSize')}>
            <SegmentedControl value={size} options={SIZES} onChange={setSize} />
          </Field>
          {showPronunciationSetting && (
            <>
              <Divider />
              <ListRow
                title={PRONUNCIATION}
                trailing={
                  <Toggle
                    value={showTransliteration}
                    onValueChange={setShowTransliteration}
                    accessibilityLabel={PRONUNCIATION}
                  />
                }
                style={ROW}
              />
            </>
          )}
          {showMeaningSetting && (
            <>
              <Divider />
              <ListRow
                title={TRANSLATION}
                trailing={
                  <Toggle
                    value={showMeaning}
                    onValueChange={setShowMeaning}
                    accessibilityLabel={TRANSLATION}
                  />
                }
                style={ROW}
              />
            </>
          )}
        </Card>
      </View>
    </Screen>
  );
}
