import { Tabs } from 'expo-router';
import { Icon, type IconName } from '@/components/icons';
import { AppTabBar } from '@/components/navigation/AppTabBar';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { useOnboardingDone, useSettingsHydrated } from '@/store/settings';
import { useSupportThread } from '@/hooks/useSupportThread';
import { t } from '@/lib/i18n';

function TabIcon({ name, focused, color }: { name: IconName; focused: boolean; color: string }) {
  return <Icon name={name} size={22} color={color} weight={focused ? 'fill' : 'regular'} />;
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
            <TabIcon name="house" focused={focused} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: t('navigation.calendar'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="calendar-dots" focused={focused} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="qibla"
        options={{
          title: t('navigation.qibla'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="compass" focused={focused} color={color as string} />
          ),
        }}
      />
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
