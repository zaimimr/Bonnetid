import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Icon, type IconName } from '@/components/icons';
import { AppTabBar } from '@/components/navigation/AppTabBar';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { FEATURES, useAvailableFeatures } from '@/components/customization/features';
import { FEATURE_IDS } from '@/lib/customization';
import { useOnboardingDone, useSettings, useSettingsHydrated } from '@/store/settings';
import { useSupportThread } from '@/hooks/useSupportThread';
import { useTheme } from '@/theme';
import { t } from '@/lib/i18n';

const isAndroid = Platform.OS === 'android';

function TabIcon({ name, focused, color }: { name: IconName; focused: boolean; color: string }) {
  return <Icon name={name} size={22} color={color} weight={focused ? 'fill' : 'regular'} />;
}

export default function TabsLayout() {
  const theme = useTheme();
  const hydrated = useSettingsHydrated();
  const onboardingDone = useOnboardingDone();
  const { unread } = useSupportThread();
  const tabSlots = useSettings((state) => state.tabSlots);
  const available = useAvailableFeatures();

  if (hydrated && !onboardingDone) return <OnboardingFlow />;

  const visible = [
    'index',
    ...tabSlots.filter((id) => available.includes(id)).map((id) => FEATURES[id].route),
    'more',
  ];

  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} visible={visible} />}
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: isAndroid ? theme.colors.background : theme.colors.surface,
        },
        headerShadowVisible: !isAndroid,
        headerTitleStyle: { color: theme.colors.textPrimary },
        headerTintColor: theme.colors.primary,
        sceneStyle: { backgroundColor: theme.colors.background },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('navigation.today'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="house" focused={focused} color={color as string} />
          ),
        }}
      />
      {FEATURE_IDS.map((id) => {
        const feature = FEATURES[id];
        const ownScreen = id === 'calendar' || id === 'qibla';
        return (
          <Tabs.Screen
            key={id}
            name={feature.route}
            options={{
              title: feature.label,
              headerShown: !ownScreen,
              headerTitle: feature.title,
              tabBarIcon: ({ color, focused }) => (
                <TabIcon name={feature.icon} focused={focused} color={color as string} />
              ),
            }}
          />
        );
      })}
      <Tabs.Screen
        name="more"
        options={{
          title: t('navigation.more'),
          tabBarBadge: unread > 0 ? '' : undefined,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="squares-four" focused={focused} color={color as string} />
          ),
        }}
      />
    </Tabs>
  );
}
