import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  useColorScheme,
} from 'react-native';
import { Alert } from '../../src/utils/alert';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { authService } from '../../src/services/authService';
import { Colors, DarkColors, Spacing, FontSizes, BorderRadius, Shadows, RSpacing, RFontSizes, isSmallDevice } from '../../src/constants/theme';
import { screenWidth as SCREEN_WIDTH } from '../../src/utils/responsive';

const createForgotSchema = (t: any) => z.object({
  email: z.string().email(t('validation.invalidEmail')),
});

type ForgotForm = z.infer<ReturnType<typeof createForgotSchema>>;

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const { theme } = useSettingsStore();
  const [loading, setLoading] = useState(false);

  const isDark = theme === 'dark' || (theme === 'system' && colorScheme === 'dark');
  const colors = isDark ? DarkColors : Colors;

  const forgotSchema = createForgotSchema(t);

  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotForm) => {
    setLoading(true);
    try {
      await authService.forgotPassword(data);
      Alert.alert(
        t('auth.codeSent'),
        t('auth.resetCodeSent'),
        [
          {
            text: t('common.continue'),
            onPress: () =>
              router.push({
                pathname: '/(auth)/reset-password',
                params: { email: data.email },
              }),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Back Button */}
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backText, { color: colors.primary }]}>← {t('common.back')}</Text>
        </Pressable>

        {/* Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🔐</Text>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.text }]}>
          {t('auth.forgotPassword')}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t('auth.forgotPasswordDesc')}
        </Text>

        {/* Form */}
        <View style={styles.form}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={t('auth.email')}
                placeholder={t('admin.emailPlaceholder')}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                leftIcon="mail-outline"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
              />
            )}
          />

          <Button
            title={t('auth.sendCode')}
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            size="lg"
            style={styles.submitButton}
          />
        </View>

        {/* Back to Login */}
        <View style={styles.footer}>
          <Pressable onPress={() => router.push('/(auth)/login')}>
            <Text style={[styles.linkText, { color: colors.primary }]}>
              {t('auth.backToLogin')}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: RSpacing.lg,
  },
  keyboardView: {
    flex: 1,
  },
  backButton: {
    marginTop: RSpacing.md,
    marginBottom: RSpacing.xl,
  },
  backText: {
    fontSize: RFontSizes.lg,
    fontWeight: '500',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: RSpacing.lg,
  },
  icon: {
    fontSize: 64,
  },
  title: {
    fontSize: RFontSizes.xxl,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: RSpacing.sm,
  },
  subtitle: {
    fontSize: RFontSizes.md,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: RSpacing.xl,
  },
  form: {
    flex: 1,
  },
  submitButton: {
    marginTop: RSpacing.md,
  },
  footer: {
    alignItems: 'center',
    marginBottom: RSpacing.xl,
  },
  linkText: {
    fontSize: RFontSizes.md,
    fontWeight: '600',
  },
});
