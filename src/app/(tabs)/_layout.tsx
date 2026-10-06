import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppTabBar } from '@/components/navigation/AppTabBar';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { useOnboardingDone, useSettingsHydrated } from '@/store/settings';
import { useSupportThread } from '@/hooks/useSupportThread';
import { t } from '@/lib/i18n';

type IconName = keyof typeof Ionicons.glyphMap;

function TabIcon({
  name,
  activeName,
  focused,
  color,
}: {
  name: IconName;
  activeName: IconName;
  focused: boolean;
  color: string;
}) {
  return <Ionicons name={focused ? activeName : name} size={22} color={color} />;
}

export default function TabsLayout() {
  const hydrated = useSettingsHydrated();
  const onboardingDone = useOnboardingDone();
  const { unread } = useSupportThread();

  if (hydrated && !onboardingDone) return <OnboardingFlow />;

  return (
    <Tabs tabBar={(props) => <AppTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('navigation.today'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home-outline" activeName="home" focused={focused} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: t('navigation.calendar'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="calendar-outline" activeName="calendar" focused={focused} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="qibla"
        options={{
          title: t('navigation.qibla'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="compass-outline" activeName="compass" focused={focused} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: t('navigation.more'),
          tabBarBadge: unread > 0 ? '' : undefined,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="apps-outline" activeName="apps" focused={focused} color={color as string} />
          ),
        }}
      />
    </Tabs>
  );
}
