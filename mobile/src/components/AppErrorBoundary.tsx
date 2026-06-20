// Friendly fallback UI for expo-router's ErrorBoundary (a render crash). Instead
// of a white screen, the user sees a localized "something went wrong" message and
// a Reload button. Works on web and native.
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/stores/settingsStore';
import { Colors, DarkColors } from '@/constants/theme';

export function AppErrorFallback({ retry }: { error: Error; retry: () => void }) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const { theme } = useSettingsStore();
  const isDark = theme === 'dark' || (theme === 'system' && colorScheme === 'dark');
  const colors = isDark ? DarkColors : Colors;

  const onReload = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.reload();
    } else {
      retry();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={styles.emoji}>🐱</Text>
      <Text style={[styles.title, { color: colors.text }]}>{t('errors.title')}</Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>{t('errors.unknown')}</Text>
      <Pressable
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={onReload}
        accessibilityRole="button"
        accessibilityLabel={t('errors.reload')}
      >
        <Text style={[styles.buttonText, { color: colors.background }]}>{t('errors.reload')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  message: { fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: 24 },
  button: { paddingVertical: 12, paddingHorizontal: 28, borderRadius: 12 },
  buttonText: { fontSize: 16, fontWeight: '600' },
});

export default AppErrorFallback;
