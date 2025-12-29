import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { Colors, DarkColors } from '../../src/constants/theme';

export default function AuthLayout() {
  const colorScheme = useColorScheme();
  const { theme } = useSettingsStore();
  const isDark = theme === 'dark' || (theme === 'system' && colorScheme === 'dark');
  const colors = isDark ? DarkColors : Colors;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="verify-email" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="reset-password" />
      <Stack.Screen name="brand-select" />
    </Stack>
  );
}
