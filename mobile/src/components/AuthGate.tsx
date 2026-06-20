// Route guard for protected route groups.
// On native the only entry point is app/index.tsx (which redirects by auth/brand),
// so these checks are no-ops for a legitimately-navigated user. On web the URL bar
// lets anyone deep-link straight into a group layout (bypassing index.tsx), so each
// protected group ((tabs), (screens), (admin)) wraps its navigator in <AuthGate> to
// enforce authentication, brand selection, and — for admin — role.
import React from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, Platform, StyleSheet, View, useColorScheme } from 'react-native';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { Colors, DarkColors } from '@/constants/theme';

interface AuthGateProps {
  children: React.ReactNode;
  /** Require an authenticated user to have selected a brand (customer surfaces). */
  requireBrand?: boolean;
  /** Require role admin / super_admin (admin surfaces). */
  requireAdmin?: boolean;
}

function Loading() {
  const colorScheme = useColorScheme();
  const { theme } = useSettingsStore();
  const isDark = theme === 'dark' || (theme === 'system' && colorScheme === 'dark');
  const colors = isDark ? DarkColors : Colors;
  return (
    <View style={[styles.center, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export function AuthGate({ children, requireBrand, requireAdmin }: AuthGateProps) {
  // Native already centralizes guarding in app/index.tsx and has no typeable URL
  // bar, so on native this is a passthrough — keeping native routing byte-for-byte
  // unchanged. The guard only does work on web (deep links / hard refresh).
  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  return (
    <AuthGateWeb requireBrand={requireBrand} requireAdmin={requireAdmin}>
      {children}
    </AuthGateWeb>
  );
}

function AuthGateWeb({ children, requireBrand, requireAdmin }: AuthGateProps) {
  const { isAuthenticated, isInitialized: authInitialized, user } = useAuthStore();
  const { hasSelectedBrand, isInitialized: settingsInitialized } = useSettingsStore();

  // Stores still hydrating (RootLayout already gates on this, but be defensive).
  if (!authInitialized || !settingsInitialized) {
    return <Loading />;
  }

  // Not logged in → login.
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // Authenticated but the /auth/me fetch hasn't populated the user yet — treat as
  // a transient loading state rather than mis-redirecting a real admin.
  if ((requireAdmin || requireBrand) && !user) {
    return <Loading />;
  }

  // Admin surfaces: enforce role.
  if (requireAdmin && user && user.role !== 'admin' && user.role !== 'super_admin') {
    return <Redirect href="/(tabs)/home" />;
  }

  // Customer surfaces: enforce brand selection.
  if (requireBrand && !hasSelectedBrand) {
    return <Redirect href="/(auth)/brand-select" />;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AuthGate;
