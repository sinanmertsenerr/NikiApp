import { useState, useEffect, useRef, Fragment } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  useColorScheme,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { Alert } from '../../src/utils/alert';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { useAuthStore } from '../../src/stores/authStore';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { authService } from '../../src/services/authService';
import { userService } from '../../src/services/userService';
import { BRANDS } from '../../src/constants/brands';
import { Colors, DarkColors, Spacing, FontSizes, BorderRadius, RSpacing, RFontSizes, isSmallDevice } from '../../src/constants/theme';
import { screenWidth as SCREEN_WIDTH } from '../../src/utils/responsive';
import i18n from '../../src/i18n';
import { COUNTRIES, DEFAULT_COUNTRY, Country } from '../../src/constants/countries';
import { CountryPickerModal } from '../../src/components/ui/CountryPickerModal';

const createLoginSchema = (t: any) => z.object({
  identifier: z.string().min(3, t('validation.identifierRequired', 'Email veya telefon gerekli')),
  password: z.string().min(1, t('validation.passwordRequired')),
});

type LoginForm = z.infer<ReturnType<typeof createLoginSchema>>;

export default function LoginScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const { theme, selectedBrand } = useSettingsStore();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');

  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country>(DEFAULT_COUNTRY);

  const isDark = theme === 'dark' || (theme === 'system' && colorScheme === 'dark');
  const colors = isDark ? DarkColors : Colors;
  const brand = BRANDS[selectedBrand];

  // Format phone number as (555) 123 45 67 (3-3-2-2 pattern with parentheses)
  const formatPhoneNumber = (text: string): string => {
    // Remove all non-digit characters
    const digits = text.replace(/\D/g, '');

    // Apply (555) 123 45 67 formatting
    let formatted = '';
    if (digits.length > 0) formatted += '(' + digits.substring(0, 3);
    if (digits.length >= 3) formatted += ') ';
    if (digits.length > 3) formatted += digits.substring(3, 6);
    if (digits.length > 6) formatted += ' ' + digits.substring(6, 8);
    if (digits.length > 8) formatted += ' ' + digits.substring(8, 10);

    return formatted;
  };

  // Remove formatting to get raw phone number for submission
  const unformatPhoneNumber = (text: string): string => {
    return text.replace(/\D/g, '');
  };

  const loginSchema = createLoginSchema(t);
  const hasAutoSubmitted = useRef(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  // Watch form values for autofill detection
  const identifier = watch('identifier');
  const password = watch('password');

  // Auto-submit when both fields are filled (likely from autofill)
  useEffect(() => {
    // Check if both fields have valid values and we haven't auto-submitted yet
    if (
      identifier &&
      password &&
      identifier.length >= 3 &&
      password.length >= 6 &&
      !hasAutoSubmitted.current &&
      !loading
    ) {
      // Small delay to ensure autofill has completed
      const timer = setTimeout(() => {
        if (!hasAutoSubmitted.current) {
          hasAutoSubmitted.current = true;
          Keyboard.dismiss();
          handleSubmit(onSubmit)();
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [identifier, password]);

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      // Format identifier based on login method
      const identifier = loginMethod === 'phone'
        ? `${selectedCountry.dialCode}${data.identifier}`
        : data.identifier;

      const result = await authService.login({
        ...data,
        identifier // Override with formatted identifier
      });
      await login(result.user, result.tokens);

      // Fetch user profile and apply their language preference
      try {
        const profile = await userService.getProfile();
        if (profile?.language && ['tr', 'en'].includes(profile.language)) {
          await i18n.changeLanguage(profile.language);
        }
      } catch {
        // Non-critical - continue with default language
      }

      // Brand is auto-selected (single active brand) — go straight to home.
      router.replace('/(tabs)/home');
    } catch (error: any) {
      // Branch on the backend's stable error code, not a localized substring.
      if (error?.code === 'PHONE_NOT_VERIFIED') {
        Alert.alert(t('auth.phoneVerification'), error.message, [{ text: t('common.ok') }]);
      } else if (error?.code === 'EMAIL_NOT_VERIFIED') {
        Alert.alert(t('auth.emailNotVerified'), t('auth.pleaseVerifyEmail'), [
          {
            text: t('auth.verify'),
            onPress: () =>
              router.push({
                pathname: '/(auth)/verify-email',
                params: { email: data.identifier },
              }),
          },
          { text: t('common.cancel'), style: 'cancel' },
        ]);
      } else {
        Alert.alert(t('common.error'), error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // On web, TouchableWithoutFeedback+Keyboard.dismiss captures pointer events and
  // breaks click/drag/selection inside inputs — so only wrap with it on native.
  const DismissWrap: any = Platform.OS === 'web' ? Fragment : TouchableWithoutFeedback;
  const dismissProps: any =
    Platform.OS === 'web' ? {} : { onPress: Keyboard.dismiss, accessible: false };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <DismissWrap {...dismissProps}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image
                source={isDark ? brand.logoLight : brand.logo}
                style={styles.logo}
                contentFit="contain"
              />
              <Text style={[styles.brandName, { color: colors.text }]}>
                {brand.name}
              </Text>
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: colors.text }]}>
              {t('auth.welcomeBack')}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {t('auth.loginToAccount')}
            </Text>

            {/* Form */}
            <View style={styles.form}>
              {/* Login Method Tabs */}
              <View style={styles.tabContainer}>
                <Pressable
                  style={[
                    styles.tab,
                    loginMethod === 'email' && styles.activeTab,
                    { borderColor: colors.border }
                  ]}
                  onPress={() => setLoginMethod('email')}
                >
                  <Text
                    style={[
                      styles.tabText,
                      { color: loginMethod === 'email' ? colors.primary : colors.textSecondary }
                    ]}
                  >
                    Email ile Giriş
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.tab,
                    loginMethod === 'phone' && styles.activeTab,
                    { borderColor: colors.border }
                  ]}
                  onPress={() => setLoginMethod('phone')}
                >
                  <Text
                    style={[
                      styles.tabText,
                      { color: loginMethod === 'phone' ? colors.primary : colors.textSecondary }
                    ]}
                  >
                    Telefon ile Giriş
                  </Text>
                </Pressable>
              </View>

              <Controller
                control={control}
                name="identifier"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label={loginMethod === 'email' ? t('auth.email') : t('auth.phone', 'Telefon Numarası')}
                    placeholder={
                      loginMethod === 'email'
                        ? "ornek@email.com"
                        : selectedCountry.code === 'TR' ? "(555) 123 45 67" : "123..."
                    }
                    prefix={loginMethod === 'phone' ? `${selectedCountry.flag} ${selectedCountry.dialCode}` : undefined}
                    onPressPrefix={loginMethod === 'phone' ? () => setShowCountryPicker(true) : undefined}
                    keyboardType={loginMethod === 'email' ? "email-address" : "phone-pad"}
                    autoCapitalize="none"
                    maxLength={loginMethod === 'phone' && selectedCountry.code === 'TR' ? 15 : undefined}
                    leftIcon={loginMethod === 'email' ? "mail-outline" : undefined}
                    value={loginMethod === 'phone' && selectedCountry.code === 'TR' ? formatPhoneNumber(value) : value}
                    onChangeText={(text) => {
                      if (loginMethod === 'phone' && selectedCountry.code === 'TR') {
                        // Store raw digits, formatting is applied in value prop
                        onChange(unformatPhoneNumber(text));
                      } else {
                        onChange(text);
                      }
                    }}
                    onBlur={onBlur}
                    error={errors.identifier?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label={t('auth.password')}
                    placeholder="••••••••"
                    isPassword
                    autoComplete="password"
                    textContentType="password"
                    leftIcon="lock-closed-outline"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.password?.message}
                  />
                )}
              />

              <Pressable
                onPress={() => router.push('/(auth)/forgot-password')}
                style={styles.forgotPassword}
              >
                <Text style={[styles.forgotText, { color: colors.primary }]}>
                  {t('auth.forgotPassword')}
                </Text>
              </Pressable>

              <Button
                title={t('auth.login')}
                onPress={handleSubmit(onSubmit)}
                loading={loading}
                size="lg"
                style={styles.submitButton}
              />
            </View>

            {/* Register Link */}
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                {t('auth.noAccount')}{' '}
              </Text>
              <Pressable onPress={() => router.push('/(auth)/register')}>
                <Text style={[styles.linkText, { color: colors.primary }]}>
                  {t('auth.register')}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </DismissWrap>

      <CountryPickerModal
        visible={showCountryPicker}
        onClose={() => setShowCountryPicker(false)}
        onSelect={setSelectedCountry}
        selectedCountryCode={selectedCountry.code}
      />
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
    marginBottom: RSpacing.lg,
  },
  backText: {
    fontSize: RFontSizes.lg,
    fontWeight: '500',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: RSpacing.xl,
  },
  logo: {
    width: isSmallDevice ? 60 : 80,
    height: isSmallDevice ? 60 : 80,
    marginBottom: RSpacing.sm,
  },
  brandName: {
    fontSize: RFontSizes.lg,
    fontWeight: '600',
  },
  title: {
    fontSize: RFontSizes.xxxl,
    fontWeight: '700',
    marginBottom: RSpacing.xs,
  },
  subtitle: {
    fontSize: RFontSizes.lg,
    marginBottom: RSpacing.xl,
  },
  form: {
    flex: 1,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: RSpacing.lg,
  },
  forgotText: {
    fontSize: RFontSizes.md,
    fontWeight: '500',
  },
  submitButton: {
    marginTop: RSpacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: RSpacing.xl,
  },
  footerText: {
    fontSize: RFontSizes.md,
  },
  linkText: {
    fontSize: RFontSizes.md,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: RSpacing.lg,
    gap: RSpacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: RSpacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: 'currentColor', // Will be overridden by inline style with primary color logic or we can rely on borderBottomColor in render
    borderBottomWidth: 3,
  },
  tabText: {
    fontSize: RFontSizes.md,
    fontWeight: '600',
  },
});
