import { Linking, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card, Divider, ListRow, Screen, SectionHeader } from '@/components/ui';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';
import { t } from '@/lib/i18n';

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
          {t({ nb: 'Islamsk Råd Norge', en: 'Islamic Council of Norway', ar: 'المجلس الإسلامي النرويجي', ur: 'اسلامک کونسل ناروے' })}
        </AppText>
      </View>

      <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
        <AppText tone="textSecondary">
          {t({
            nb: 'Islamsk Råd Norge (IRN) er en paraplyorganisasjon for muslimske menigheter i Norge. IRN står bak Bønnetid og leverer bønnetidene appen bygger på.',
            en: 'The Islamic Council of Norway (IRN) is an umbrella organisation for Muslim congregations in Norway. IRN is behind Bønnetid and provides the prayer times the app is built on.',
            ar: 'المجلس الإسلامي النرويجي (IRN) منظمة جامعة للجماعات الإسلامية في النرويج. يقف المجلس وراء تطبيق Bønnetid ويوفّر مواقيت الصلاة التي يعتمد عليها التطبيق.',
            ur: 'اسلامک کونسل ناروے (IRN) ناروے میں مسلم جماعتوں کی ایک چھتری تنظیم ہے۔ IRN ہی Bønnetid کے پیچھے ہے اور وہ نماز کے اوقات فراہم کرتی ہے جن پر ایپ مبنی ہے۔',
          })}
        </AppText>
        <AppText tone="textSecondary">
          {t({
            nb: 'Tidene kommer fra prosjektet Felles bønnetid, som samler moskeene i Norge om én felles standard for når bønnene begynner. Slik viser appen de samme tidene som moskeen din bruker.',
            en: 'The times come from the Felles bønnetid project, which unites the mosques in Norway around one shared standard for when the prayers begin. That way the app shows the same times your mosque uses.',
            ar: 'تأتي الأوقات من مشروع Felles bønnetid الذي يجمع مساجد النرويج على معيار موحّد لبداية أوقات الصلاة. وبذلك يعرض التطبيق الأوقات نفسها التي يعتمدها مسجدك.',
            ur: 'اوقات Felles bønnetid منصوبے سے آتے ہیں، جو ناروے کی مساجد کو نمازوں کے آغاز کے ایک مشترکہ معیار پر متفق کرتا ہے۔ اس طرح ایپ وہی اوقات دکھاتی ہے جو آپ کی مسجد استعمال کرتی ہے۔',
          })}
        </AppText>
      </View>

      <SectionHeader title={t({ nb: 'Les mer', en: 'Read more', ar: 'اقرأ المزيد', ur: 'مزید پڑھیں' })} />
      <Card padding="sm" rounded="xl">
        <ListRow
          title="Felles bønnetid"
          subtitle={t({ nb: 'Om prosjektet bak tidene', en: 'About the project behind the times', ar: 'عن المشروع الذي يقف وراء الأوقات', ur: 'اوقات کے پیچھے منصوبے کے بارے میں' })}
          leading={<Ionicons name="time-outline" size={20} color={theme.colors.primary} />}
          trailing={<Ionicons name="open-outline" size={18} color={theme.colors.textMuted} />}
          onPress={() => Linking.openURL(PROJECT_URL).catch(() => {})}
          style={{ paddingHorizontal: spacing.md }}
        />
        <Divider />
        <ListRow
          title="irn.no"
          subtitle={t({ nb: 'Islamsk Råd Norge på nett', en: 'Islamic Council of Norway online', ar: 'المجلس الإسلامي النرويجي على الإنترنت', ur: 'اسلامک کونسل ناروے آن لائن' })}
          leading={<Ionicons name="globe-outline" size={20} color={theme.colors.primary} />}
          trailing={<Ionicons name="open-outline" size={18} color={theme.colors.textMuted} />}
          onPress={() => Linking.openURL(HOME_URL).catch(() => {})}
          style={{ paddingHorizontal: spacing.md }}
        />
      </Card>
    </Screen>
  );
}
