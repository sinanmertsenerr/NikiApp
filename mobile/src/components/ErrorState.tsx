// Inline error state for data screens: a clear localized message + a Retry
// button, shown when a fetch fails (instead of a misleading empty state).
import React from 'react';
import { Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/stores/settingsStore';
import { Colors, DarkColors } from '@/constants/theme';
import { getErrorMessage } from '@/services/api';

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const { theme } = useSettingsStore();
  const isDark = theme === 'dark' || (theme === 'system' && colorScheme === 'dark');
  const colors = isDark ? DarkColors : Colors;

  return (
    <View style={styles.container}>
      <Ionicons name="cloud-offline-outline" size={48} color={colors.textTertiary} />
      <Text style={[styles.message, { color: colors.textSecondary }]}>{getErrorMessage(error)}</Text>
      {onRetry && (
        <Pressable
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel={t('common.retry')}
        >
          <Text style={[styles.buttonText, { color: colors.background }]}>{t('common.retry')}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 },
  message: { fontSize: 15, lineHeight: 22, textAlign: 'center' },
  button: { paddingVertical: 10, paddingHorizontal: 24, borderRadius: 12, marginTop: 4 },
  buttonText: { fontSize: 15, fontWeight: '600' },
});

export default ErrorState;
