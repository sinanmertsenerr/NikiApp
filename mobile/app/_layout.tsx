import { useEffect } from 'react';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClientProvider } from '@tanstack/react-query';
import { useColorScheme, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { queryClient } from '@/services/queryClient';
import { socketService } from '@/services/socketService';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MobileFrame } from '@/components/web/MobileFrame';
import { OfflineBanner } from '@/components/OfflineBanner';
import { AppErrorFallback } from '@/components/AppErrorBoundary';
import '@/i18n';

// expo-router renders this instead of a white screen if any route crashes.
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return <AppErrorFallback error={error} retry={retry} />;
}


// Keep the splash screen visible while we fetch resources
// Moved inside useEffect to prevent race conditions and unhandled promise rejections during hot reload

function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const { theme } = useSettingsStore();

  // Initialize push notifications (will only register if authenticated)
  usePushNotifications();

  // Determine actual theme
  const isDark = theme === 'dark' || (theme === 'system' && colorScheme === 'dark');

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <OfflineBanner />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: isDark ? '#121212' : '#FFFFFF',
          },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(admin)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const { initialize: initAuth, isInitialized: authInitialized } = useAuthStore();
  const { initialize: initSettings, isInitialized: settingsInitialized } = useSettingsStore();

  useEffect(() => {
    async function prepare() {
      try {
        // Prevent auto hide
        try {
          await SplashScreen.preventAutoHideAsync().catch(() => {
            /* reload race condition, ignore */
          });
        } catch (e) {
          // Ignore error if splash screen is already hidden or not available
        }

        // Socket connection is now handled in authStore after auth
        await Promise.all([initAuth(), initSettings()]);
      } catch (e) {
        console.warn('Initialization error:', e);
      } finally {
        if (authInitialized || true) { // Always try to hide eventually
          try {
            await SplashScreen.hideAsync();
          } catch (e) {
            // Ignore error if splash screen is already hidden
          }
        }
      }
    }
    prepare();

    // Cleanup socket on unmount
    return () => {
      socketService.disconnect();
    };
  }, []);

  if (!authInitialized || !settingsInitialized) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={styles.container}>
        <SafeAreaProvider>
          <MobileFrame>
            <RootLayoutContent />
          </MobileFrame>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
