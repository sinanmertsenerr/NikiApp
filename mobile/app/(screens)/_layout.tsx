import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { Colors, DarkColors } from '../../src/constants/theme';

export default function ScreensLayout() {
  const colorScheme = useColorScheme();
  const { theme } = useSettingsStore();

  const isDark = theme === 'dark' || (theme === 'system' && colorScheme === 'dark');
  const colors = isDark ? DarkColors : Colors;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    />
  );
}
