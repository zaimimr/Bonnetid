import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme } from '@/theme';
import { configureNotificationHandler } from '@/lib/notifications';
import { useNotificationScheduler } from '@/hooks/useNotificationScheduler';

const DAY = 24 * 60 * 60 * 1000;

const queryClient = new QueryClient({
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
  buster: 'v2',
};

configureNotificationHandler();

function RootNavigator() {
  const theme = useTheme();
  useNotificationScheduler();

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
          name="qibla"
          options={{
            headerShown: true,
            title: 'Qibla',
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
          name="location-picker"
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'Velg sted',
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

export default function RootLayout() {
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
