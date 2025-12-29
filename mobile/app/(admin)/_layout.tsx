import { Stack, router } from 'expo-router';
import { useColorScheme, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { Colors, DarkColors } from '../../src/constants/theme';

export default function AdminLayout() {
  const colorScheme = useColorScheme();
  const { theme } = useSettingsStore();
  const { t } = useTranslation();
  const isDark = theme === 'dark' || (theme === 'system' && colorScheme === 'dark');
  const colors = isDark ? DarkColors : Colors;

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: isDark ? '#1E1E1E' : colors.primary,
        },
        headerTintColor: '#FFFFFF',
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen
        name="dashboard"
        options={{
          title: t('admin.title'),
          headerLeft: () => (
            <Pressable
              onPress={() => router.replace('/(tabs)/home')}
              style={{ marginLeft: 8, flexDirection: 'row', alignItems: 'center' }}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </Pressable>
          ),
        }}
      />
      <Stack.Screen name="scan-qr" options={{ title: t('admin.scanQr') }} />
      <Stack.Screen name="users" options={{ title: t('admin.users') }} />
      <Stack.Screen name="campaigns" options={{ title: t('admin.campaigns') }} />
      <Stack.Screen name="groups" options={{ title: t('groups.title') }} />
      <Stack.Screen name="group-detail" options={{ title: t('groups.editGroup') }} />
      <Stack.Screen name="menu-management" options={{ title: t('admin.menuManagement') }} />
      <Stack.Screen name="user-detail" options={{ title: t('admin.userDetail') }} />
    </Stack>
  );
}
