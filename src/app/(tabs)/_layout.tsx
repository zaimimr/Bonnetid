import { Platform, Pressable, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { useTheme } from '@/theme';
import { radius } from '@/theme/tokens';
import { useOnboardingDone, useSettingsHydrated } from '@/store/settings';
import { useSupportThread } from '@/hooks/useSupportThread';

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
  const theme = useTheme();
  const icon = <Ionicons name={focused ? activeName : name} size={22} color={color} />;
  if (Platform.OS !== 'android') return icon;
  return (
    <View
      style={{
        width: 56,
        height: 30,
        borderRadius: radius.full,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: focused ? theme.colors.primarySoft : 'transparent',
      }}>
      {icon}
    </View>
  );
}

export default function TabsLayout() {
  const theme = useTheme();
  const hydrated = useSettingsHydrated();
  const onboardingDone = useOnboardingDone();
  const { unread } = useSupportThread();

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
        tabBarItemStyle: Platform.OS === 'android' ? { paddingTop: 6 } : undefined,
        tabBarButton:
          Platform.OS === 'android'
            ? ({ ref: _ref, android_ripple: _ripple, ...props }) => <Pressable {...props} />
            : undefined,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Oversikt',
          tabBarLabel: ({ color }) => <TabLabel title="Oversikt" color={color as string} />,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home-outline" activeName="home" focused={focused} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Kalender',
          tabBarLabel: ({ color }) => <TabLabel title="Kalender" color={color as string} />,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="calendar-outline" activeName="calendar" focused={focused} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="qibla"
        options={{
          title: 'Qibla',
          tabBarLabel: ({ color }) => <TabLabel title="Qibla" color={color as string} />,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="compass-outline" activeName="compass" focused={focused} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'Mer',
          tabBarBadge: unread > 0 ? '' : undefined,
          tabBarBadgeStyle: {
            minWidth: 10,
            maxHeight: 10,
            borderRadius: 5,
            backgroundColor: theme.colors.primary,
          },
          tabBarLabel: ({ color }) => <TabLabel title="Mer" color={color as string} />,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="apps-outline" activeName="apps" focused={focused} color={color as string} />
          ),
        }}
      />
    </Tabs>
  );
}
