import { Linking, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card, Divider, ListRow, Screen, SectionHeader } from '@/components/ui';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';

const PROJECT_URL = 'https://irn.no/prosjekter/felles-bonnetid/';
const HOME_URL = 'https://irn.no';

export default function IrnScreen() {
  const theme = useTheme();

  return (
    <Screen scroll edges={[]}>
      <View style={{ alignItems: 'center', gap: spacing.md, marginTop: spacing.lg }}>
        <Image
          source={
            theme.scheme === 'dark'
              ? require('../../assets/images/irn-logo-dark.png')
              : require('../../assets/images/irn-logo.png')
          }
          style={{ width: 96, height: 106 }}
          contentFit="contain"
        />
        <AppText size="lg" weight="semibold" align="center">
          Islamsk Råd Norge
        </AppText>
      </View>

      <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
        <AppText tone="textSecondary">
          Islamsk Råd Norge (IRN) er en paraplyorganisasjon for muslimske menigheter i Norge. IRN
          står bak Bønnetid og leverer bønnetidene appen bygger på.
        </AppText>
        <AppText tone="textSecondary">
          Tidene kommer fra prosjektet Felles bønnetid, som samler moskeene i Norge om én felles
          standard for når bønnene begynner. Slik viser appen de samme tidene som moskeen din bruker.
        </AppText>
      </View>

      <SectionHeader title="Les mer" />
      <Card padding="sm" rounded="xl">
        <ListRow
          title="Felles bønnetid"
          subtitle="Om prosjektet bak tidene"
          leading={<Ionicons name="time-outline" size={20} color={theme.colors.primary} />}
          trailing={<Ionicons name="open-outline" size={18} color={theme.colors.textMuted} />}
          onPress={() => Linking.openURL(PROJECT_URL).catch(() => {})}
          style={{ paddingHorizontal: spacing.md }}
        />
        <Divider />
        <ListRow
          title="irn.no"
          subtitle="Islamsk Råd Norge på nett"
          leading={<Ionicons name="globe-outline" size={20} color={theme.colors.primary} />}
          trailing={<Ionicons name="open-outline" size={18} color={theme.colors.textMuted} />}
          onPress={() => Linking.openURL(HOME_URL).catch(() => {})}
          style={{ paddingHorizontal: spacing.md }}
        />
      </Card>
    </Screen>
  );
}
