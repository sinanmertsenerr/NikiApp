import { Tabs } from 'expo-router';
import { Platform, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useSettingsStore } from '../../src/stores/settingsStore';
import { Colors, DarkColors } from '../../src/constants/theme';
import { AuthGate } from '../../src/components/AuthGate';

type IconName = keyof typeof Ionicons.glyphMap;

const WEB_TAB_BAR_VISIBLE_HEIGHT = 64;
const WEB_SAFE_AREA_BOTTOM = 'env(safe-area-inset-bottom, 0px)';

export default function TabLayout() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const { theme } = useSettingsStore();

  const isDark = theme === 'dark' || (theme === 'system' && colorScheme === 'dark');
  const colors = isDark ? DarkColors : Colors;

  return (
    <AuthGate requireBrand>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        // Themed on ALL platforms (web had no case -> default white bar). On web
        // the iOS PWA home-indicator area is handled with CSS env() in calc():
        // the browser resolves and re-resolves it at layout time (rotation,
        // toolbar collapse), so no JS measurement or device sniffing is needed.
        // The real clip fix is the taller bar + dropping the fixed item height,
        // which let the label sit inside the bar instead of under the indicator.
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: Platform.OS === 'android' ? 0 : 0.5,
          ...(Platform.OS === 'android' ? { elevation: 8 } : null),
          ...(Platform.OS === 'web'
            ? {
                height: `calc(${WEB_TAB_BAR_VISIBLE_HEIGHT}px + ${WEB_SAFE_AREA_BOTTOM})` as any,
                paddingBottom: `calc(${WEB_SAFE_AREA_BOTTOM} + 4px)` as any,
                paddingTop: 6,
              }
            : null),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          lineHeight: 14,
          fontWeight: '500',
          marginTop: -2,
          marginBottom: 0,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: t('tabs.menu'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'cafe' : 'cafe-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: t('tabs.wallet'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'wallet' : 'wallet-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      {/* Hidden tabs - accessible via Quick Actions */}
      <Tabs.Screen
        name="campaigns"
        options={{
          href: null, // Hide from tab bar
          title: t('tabs.campaigns'),
        }}
      />
      <Tabs.Screen
        name="wheel"
        options={{
          href: null, // Hide from tab bar
          title: t('tabs.wheel'),
        }}
      />
      <Tabs.Screen
        name="raffles"
        options={{
          href: null, // Hide from tab bar
          title: t('tabs.raffles'),
        }}
      />
    </Tabs>
    </AuthGate>
  );
}
