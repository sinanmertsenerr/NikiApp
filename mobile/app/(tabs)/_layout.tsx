import { Tabs } from 'expo-router';
import { Platform, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useSettingsStore } from '../../src/stores/settingsStore';
import { Colors, DarkColors } from '../../src/constants/theme';
import { AuthGate } from '../../src/components/AuthGate';

type IconName = keyof typeof Ionicons.glyphMap;

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
        tabBarStyle: Platform.select({
          ios: {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            borderTopWidth: 0.5,
          },
          android: {
            backgroundColor: colors.card,
            elevation: 8,
            borderTopWidth: 0,
          },
        }),
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
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
