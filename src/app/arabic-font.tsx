import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ArabicText } from '@/components/duas/ArabicText';
import { AppText, Card, Divider, Screen } from '@/components/ui';
import { useTheme } from '@/theme';
import { arabicFonts, opacity, spacing, type ArabicFontKey } from '@/theme/tokens';
import { useSettings } from '@/store/settings';

const SAMPLE = 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ';
const FONTS = Object.keys(arabicFonts) as ArabicFontKey[];

export default function ArabicFontScreen() {
  const theme = useTheme();
  const current = useSettings((state) => state.duaArabicFont);
  const setFont = useSettings((state) => state.setDuaArabicFont);

  return (
    <Screen scroll edges={[]}>
      <Card padding="sm" rounded="xl" style={{ marginTop: spacing.lg }}>
        {FONTS.map((key, index) => {
          const selected = key === current;
          return (
            <View key={key}>
              {index > 0 && <Divider />}
              <Pressable
                onPress={() => setFont(key)}
                accessibilityRole="radio"
                accessibilityLabel={arabicFonts[key].label}
                accessibilityState={{ selected }}
                style={({ pressed }) => ({
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  opacity: pressed ? opacity.pressed : 1,
                })}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: 32,
                  }}>
                  <AppText weight={selected ? 'semibold' : 'regular'}>{arabicFonts[key].label}</AppText>
                  {selected ? (
                    <Ionicons name="checkmark" size={22} color={theme.colors.primary} />
                  ) : null}
                </View>
                <ArabicText font={key}>{SAMPLE}</ArabicText>
              </Pressable>
            </View>
          );
        })}
      </Card>
    </Screen>
  );
}
