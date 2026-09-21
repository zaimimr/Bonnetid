import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { useTheme } from '@/theme';
import { useOnboardingDone, useSettingsHydrated } from '@/store/settings';

const MAX_TAB_FONT_SCALE = 1.15;

function TabLabel({ title, color }: { title: string; color: string }) {
  return (
    <AppText
      size="xs"
      weight="medium"
      color={color}
      align="center"
      maxFontSizeMultiplier={MAX_TAB_FONT_SCALE}
      numberOfLines={1}>
      {title}
    </AppText>
  );
}

export default function TabsLayout() {
  const theme = useTheme();
  const hydrated = useSettingsHydrated();
  const onboardingDone = useOnboardingDone();

  if (hydrated && !onboardingDone) return <OnboardingFlow />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.tabBarActive,
        tabBarInactiveTintColor: theme.colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: theme.colors.tabBarBackground,
          borderTopColor: theme.colors.border,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Oversikt',
          tabBarLabel: ({ color }) => <TabLabel title="Oversikt" color={color} />,
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Kalender',
          tabBarLabel: ({ color }) => <TabLabel title="Kalender" color={color} />,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="qibla"
        options={{
          title: 'Qibla',
          tabBarLabel: ({ color }) => <TabLabel title="Qibla" color={color} />,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="compass-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'Mer',
          tabBarLabel: ({ color }) => <TabLabel title="Mer" color={color} />,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="apps-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
