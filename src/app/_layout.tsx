import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryCache, QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack, useNavigationContainerRef } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme } from '@/theme';
import { configureNotificationHandler } from '@/lib/notifications';
import { initTelemetry, navigationIntegration, Sentry, trackError } from '@/lib/telemetry';
import { useNotificationScheduler } from '@/hooks/useNotificationScheduler';
import { useNotificationResponses } from '@/hooks/useNotificationResponses';
import { useAutoLocation } from '@/hooks/useAutoLocation';
import { useRamadanReminders } from '@/hooks/useRamadanReminders';
import { useReviewPrompt } from '@/hooks/useReviewPrompt';
import { useWidgetSync } from '@/hooks/useWidgetSync';
import { useNow } from '@/hooks/useNow';
import { usePrayerLogSync } from '@/hooks/usePrayerLogSync';

initTelemetry();

const DAY = 24 * 60 * 60 * 1000;

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) =>
      trackError(error, 'react-query', { queryKey: JSON.stringify(query.queryKey) }),
  }),
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      gcTime: 30 * DAY,
    },
  },
});

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'bonnetid-query-cache',
  throttleTime: 2000,
});

const persistOptions = {
  persister,
  maxAge: 60 * DAY,
  buster: 'v9',
};

configureNotificationHandler();

function RootNavigator() {
  const theme = useTheme();
  const now = useNow(60_000);
  useAutoLocation();
  useNotificationScheduler();
  useNotificationResponses();
  useRamadanReminders();
  useReviewPrompt();
  useWidgetSync(now);
  usePrayerLogSync(now);

  return (
    <>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="timetable"
          options={{
            headerShown: true,
            title: 'Bønnetider',
            headerBackTitle: 'Tilbake',
            headerStyle: { backgroundColor: theme.colors.surface },
            headerTitleStyle: { color: theme.colors.textPrimary },
            headerTintColor: theme.colors.primary,
          }}
        />
        <Stack.Screen
          name="mosques"
          options={{
            headerShown: true,
            title: 'Moskeer',
            headerBackTitle: 'Tilbake',
            headerStyle: { backgroundColor: theme.colors.surface },
            headerTitleStyle: { color: theme.colors.textPrimary },
            headerTintColor: theme.colors.primary,
          }}
        />
        <Stack.Screen
          name="jummah"
          options={{
            headerShown: true,
            title: 'Fredagsbønn',
            headerBackTitle: 'Tilbake',
            headerStyle: { backgroundColor: theme.colors.surface },
            headerTitleStyle: { color: theme.colors.textPrimary },
            headerTintColor: theme.colors.primary,
          }}
        />
        <Stack.Screen
          name="tracker"
          options={{
            headerShown: true,
            title: 'Bønnesporing',
            headerBackTitle: 'Tilbake',
            headerStyle: { backgroundColor: theme.colors.surface },
            headerTitleStyle: { color: theme.colors.textPrimary },
            headerTintColor: theme.colors.primary,
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            headerShown: true,
            title: 'Innstillinger',
            headerBackTitle: 'Tilbake',
            headerStyle: { backgroundColor: theme.colors.surface },
            headerTitleStyle: { color: theme.colors.textPrimary },
            headerTintColor: theme.colors.primary,
          }}
        />
        <Stack.Screen
          name="irn"
          options={{
            headerShown: true,
            title: 'Islamsk Råd Norge',
            headerBackTitle: 'Tilbake',
            headerStyle: { backgroundColor: theme.colors.surface },
            headerTitleStyle: { color: theme.colors.textPrimary },
            headerTintColor: theme.colors.primary,
          }}
        />
        <Stack.Screen
          name="notification-sound"
          options={{
            headerShown: true,
            title: 'Varsellyd',
            headerBackTitle: 'Tilbake',
            headerStyle: { backgroundColor: theme.colors.surface },
            headerTitleStyle: { color: theme.colors.textPrimary },
            headerTintColor: theme.colors.primary,
          }}
        />
        <Stack.Screen
          name="notification-prayers"
          options={{
            headerShown: true,
            title: 'Bønner',
            headerBackTitle: 'Tilbake',
            headerStyle: { backgroundColor: theme.colors.surface },
            headerTitleStyle: { color: theme.colors.textPrimary },
            headerTintColor: theme.colors.primary,
          }}
        />
        <Stack.Screen
          name="asr-method"
          options={{
            headerShown: true,
            title: 'Asr-metode',
            headerBackTitle: 'Tilbake',
            headerStyle: { backgroundColor: theme.colors.surface },
            headerTitleStyle: { color: theme.colors.textPrimary },
            headerTintColor: theme.colors.primary,
          }}
        />
        <Stack.Screen
          name="mosque-picker"
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'Velg moské',
            headerStyle: { backgroundColor: theme.colors.surface },
            headerTitleStyle: { color: theme.colors.textPrimary },
            headerTintColor: theme.colors.primary,
          }}
        />
        <Stack.Screen
          name="day/[date]"
          options={{
            headerShown: true,
            title: '',
            headerBackTitle: 'Tilbake',
            headerStyle: { backgroundColor: theme.colors.surface },
            headerTitleStyle: { color: theme.colors.textPrimary },
            headerTintColor: theme.colors.primary,
          }}
        />
        <Stack.Screen
          name="mosque/[orgNr]"
          options={{
            headerShown: true,
            title: '',
            headerBackTitle: 'Tilbake',
            headerStyle: { backgroundColor: theme.colors.surface },
            headerTitleStyle: { color: theme.colors.textPrimary },
            headerTintColor: theme.colors.primary,
          }}
        />
      </Stack>
    </>
  );
}

function RootLayout() {
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    navigationIntegration.registerNavigationContainer(navigationRef);
  }, [navigationRef]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
        <ThemeProvider>
          <RootNavigator />
        </ThemeProvider>
      </PersistQueryClientProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayout);
