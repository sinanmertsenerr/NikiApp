import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  Pressable,
  useColorScheme,
  Alert,
  Keyboard,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
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

const CODE_LENGTH = 6;

const createResetSchema = (t: any) => z
  .object({
    newPassword: z
      .string()
      .min(8, t('validation.passwordMin'))
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        t('validation.passwordRequirements')
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: t('validation.passwordMismatch'),
    path: ['confirmPassword'],
  });

type ResetForm = z.infer<ReturnType<typeof createResetSchema>>;

export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const { email } = useLocalSearchParams<{ email: string }>();
  const colorScheme = useColorScheme();
  const { theme } = useSettingsStore();

  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const isDark = theme === 'dark' || (theme === 'system' && colorScheme === 'dark');
  const colors = isDark ? DarkColors : Colors;

  const resetSchema = createResetSchema(t);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const handleCodeChange = (text: string, index: number) => {
    const newCode = [...code];

    if (text.length > 1) {
      const pastedCode = text.slice(0, CODE_LENGTH).split('');
      pastedCode.forEach((char, i) => {
        if (i < CODE_LENGTH) {
          newCode[i] = char;
        }
      });
      setCode(newCode);
      inputRefs.current[Math.min(pastedCode.length, CODE_LENGTH - 1)]?.focus();
      return;
    }

    newCode[index] = text;
    setCode(newCode);

    if (text && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const onSubmit = async (data: ResetForm) => {
    const fullCode = code.join('');
    if (fullCode.length !== CODE_LENGTH) {
      Alert.alert(t('common.error'), t('auth.enterSixDigitCode'));
      return;
    }

    setLoading(true);
    Keyboard.dismiss();

    try {
      await authService.resetPassword({
        email: email || '',
        code: fullCode,
        newPassword: data.newPassword,
      });

      Alert.alert(
        t('common.success'),
        t('auth.passwordUpdatedSuccess'),
        [
          {
            text: t('auth.login'),
            onPress: () => router.replace('/(auth)/login'),
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={[styles.backText, { color: colors.primary }]}>← {t('common.back')}</Text>
          </Pressable>

          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>
            {t('auth.resetPassword')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            <Text style={{ fontWeight: '600' }}>{email}</Text> {t('auth.resetPasswordDesc')}
          </Text>

          {/* Code Input */}
          <Text style={[styles.label, { color: colors.text }]}>{t('auth.verificationCode')}</Text>
          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { inputRefs.current[index] = ref; }}
                style={[
                  styles.codeInput,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: digit ? colors.primary : colors.border,
                    color: colors.text,
                  },
                ]}
                value={digit}
                onChangeText={(text) => handleCodeChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          {/* Password Form */}
          <Controller
            control={control}
            name="newPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={t('auth.newPassword')}
                placeholder="••••••••"
                isPassword
                leftIcon="lock-closed-outline"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.newPassword?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={t('auth.confirmPassword')}
                placeholder="••••••••"
                isPassword
                leftIcon="lock-closed-outline"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.confirmPassword?.message}
              />
            )}
          />

          <Button
            title={t('auth.updatePassword')}
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            disabled={code.join('').length !== CODE_LENGTH}
            size="lg"
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: RSpacing.lg,
    paddingBottom: RSpacing.xl,
  },
  backButton: {
    marginTop: RSpacing.md,
    marginBottom: RSpacing.xl,
  },
  backText: {
    fontSize: RFontSizes.lg,
    fontWeight: '500',
  },
  title: {
    fontSize: RFontSizes.xxl,
    fontWeight: '700',
    marginBottom: RSpacing.sm,
  },
  subtitle: {
    fontSize: RFontSizes.md,
    lineHeight: 22,
    marginBottom: RSpacing.xl,
  },
  label: {
    fontSize: RFontSizes.md,
    fontWeight: '500',
    marginBottom: RSpacing.sm,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: RSpacing.xl,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderRadius: BorderRadius.lg,
    textAlign: 'center',
    fontSize: RFontSizes.xxl,
    fontWeight: '700',
  },
  submitButton: {
    marginTop: RSpacing.md,
  },
});
