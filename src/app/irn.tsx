import { Linking, View } from 'react-native';
import { Image } from 'expo-image';
import { Icon } from '@/components/icons';
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
          {t('irn.islamicCouncilOfNorway')}
        </AppText>
      </View>

      <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
        <AppText tone="textSecondary">
          {t('irn.theIslamicCouncilOf')}
        </AppText>
        <AppText tone="textSecondary">
          {t('irn.theTimesComeFrom')}
        </AppText>
      </View>

      <SectionHeader title={t('irn.readMore')} />
      <Card padding="sm" rounded="xl">
        <ListRow
          title="Felles bønnetid"
          subtitle={t('irn.aboutTheProjectBehind')}
          leading={<Icon name="clock" size={20} color={theme.colors.primary} />}
          trailing={<Icon name="arrow-square-out" size={18} color={theme.colors.textMuted} />}
          onPress={() => Linking.openURL(PROJECT_URL).catch(() => {})}
          style={{ paddingHorizontal: spacing.md }}
        />
        <Divider />
        <ListRow
          title="irn.no"
          subtitle={t('irn.islamicCouncilOfNorway2')}
          leading={<Icon name="globe" size={20} color={theme.colors.primary} />}
          trailing={<Icon name="arrow-square-out" size={18} color={theme.colors.textMuted} />}
          onPress={() => Linking.openURL(HOME_URL).catch(() => {})}
          style={{ paddingHorizontal: spacing.md }}
        />
      </Card>
    </Screen>
  );
}
