import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  useColorScheme,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Input } from '../../src/components/ui/Input';
import { Checkbox } from '../../src/components/ui/Checkbox';
import { Button } from '../../src/components/ui/Button';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { authService } from '../../src/services/authService';
import { BRANDS } from '../../src/constants/brands';
import { Colors, DarkColors, Spacing, FontSizes, BorderRadius, Shadows, RSpacing, RFontSizes, isSmallDevice } from '../../src/constants/theme';
import { screenWidth as SCREEN_WIDTH } from '../../src/utils/responsive';
import { COUNTRIES, DEFAULT_COUNTRY, Country } from '../../src/constants/countries';
import { CountryPickerModal } from '../../src/components/ui/CountryPickerModal';
import { KvkkModal } from '../../src/components/ui/KvkkModal';

const createRegisterSchema = (t: any, countryCode: string) => z
  .object({
    firstName: z.string().min(2, t('validation.firstNameMin')),
    lastName: z.string().min(2, t('validation.lastNameMin')),
    phone: z.string().refine((val) => {
      // Custom validation logic based on country
      if (countryCode === 'TR') {
        return /^[0-9]{10}$/.test(val);
      }
      return /^[0-9]{7,15}$/.test(val);
    }, {
      message: countryCode === 'TR'
        ? t('validation.phoneLengthTR', 'Lütfen 10 haneli numara giriniz (5XX...)')
        : t('validation.phoneLength', 'Geçerli bir telefon numarası giriniz')
    }),
    email: z.string().email(t('validation.invalidEmail')),
    password: z
      .string()
      .min(8, t('validation.passwordMin'))
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        t('validation.passwordRequirements')
      ),
    kvkkAccepted: z.boolean().refine((val) => val === true, {
      message: t('validation.kvkkRequired', 'KVKK onayı gereklidir'),
    }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: t('validation.passwordMismatch'),
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<ReturnType<typeof createRegisterSchema>>;

export default function RegisterScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const { theme, selectedBrand } = useSettingsStore();
  const [loading, setLoading] = useState(false);

  const isDark = theme === 'dark' || (theme === 'system' && colorScheme === 'dark');
  const colors = isDark ? DarkColors : Colors;
  const brand = BRANDS[selectedBrand];

  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showKvkkModal, setShowKvkkModal] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country>(DEFAULT_COUNTRY);

  // Format phone number as (555) 123 45 67 (3-3-2-2 pattern with parentheses)
  const formatPhoneNumber = (text: string): string => {
    const digits = text.replace(/\D/g, '');
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

  const registerSchema = createRegisterSchema(t, selectedCountry.code);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      password: '',
      confirmPassword: '',
      kvkkAccepted: false,
    },
  });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      const result = await authService.register({
        firstName: data.firstName,
        lastName: data.lastName,
        phone: `${selectedCountry.dialCode}${data.phone}`,
        email: data.email,
        password: data.password,
        kvkkAccepted: data.kvkkAccepted,
      });

      Alert.alert(
        t('auth.registerSuccess'),
        t('auth.verificationCodeSent'),
        [
          {
            text: t('auth.verify'),
            onPress: () =>
              router.push({
                pathname: '/(auth)/verify-email',
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={[styles.backText, { color: colors.primary }]}>← {t('common.back')}</Text>
          </Pressable>

          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={brand.logo}
              style={[styles.logo, isDark && { tintColor: '#FFFFFF' }]}
              contentFit="contain"
            />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>
            {t('auth.createAccount')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('auth.joinFamily', { brand: brand.name })}
          </Text>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.nameRow}>
              <View style={styles.nameField}>
                <Controller
                  control={control}
                  name="firstName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label={t('auth.firstName')}
                      placeholder={t('auth.firstName')}
                      autoCapitalize="words"
                      leftIcon="person-outline"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.firstName?.message}
                    />
                  )}
                />
              </View>
              <View style={styles.nameField}>
                <Controller
                  control={control}
                  name="lastName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label={t('auth.lastName')}
                      placeholder={t('auth.lastName')}
                      autoCapitalize="words"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.lastName?.message}
                    />
                  )}
                />
              </View>
            </View>

            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={t('auth.phone', 'Telefon Numarası')}
                  placeholder={selectedCountry.code === 'TR' ? "555 123 45 67" : "123..."}
                  prefix={`${selectedCountry.flag} ${selectedCountry.dialCode}`}
                  onPressPrefix={() => setShowCountryPicker(true)}
                  keyboardType="phone-pad"
                  maxLength={selectedCountry.code === 'TR' ? 15 : 15}
                  value={selectedCountry.code === 'TR' ? formatPhoneNumber(value) : value}
                  onChangeText={(text) => {
                    if (selectedCountry.code === 'TR') {
                      onChange(unformatPhoneNumber(text));
                    } else {
                      onChange(text);
                    }
                  }}
                  onBlur={onBlur}
                  error={errors.phone?.message}
                />
              )}
            />

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

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={t('auth.password')}
                  placeholder="••••••••"
                  isPassword
                  leftIcon="lock-closed-outline"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
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
            <Controller
              control={control}
              name="kvkkAccepted"
              render={({ field: { onChange, value } }) => (
                <>
                  <Checkbox
                    checked={value}
                    onChange={(checked) => {
                      if (checked) {
                        // Allowing direct check is disabled based on user requirement "okumadan işaretlemesine izin verme"
                        // So if they try to check it, we open modal
                        setShowKvkkModal(true);
                      } else {
                        onChange(false);
                      }
                    }}
                    label={
                      <Text style={{ fontSize: RFontSizes.sm, color: colors.text }}>
                        {t('auth.kvkkConsent', 'Kişisel verilerimin işlenmesini onaylıyorum.')}{' '}
                        <Text
                          style={{ color: colors.primary, fontWeight: 'bold' }}
                          onPress={() => setShowKvkkModal(true)}
                        >
                          {t('auth.kvkkLightingText', 'Aydınlatma Metni')}
                        </Text>
                      </Text>
                    }
                    error={errors.kvkkAccepted?.message}
                    style={{ marginTop: RSpacing.sm }}
                  />
                  <KvkkModal
                    visible={showKvkkModal}
                    onClose={() => setShowKvkkModal(false)}
                    onAccept={() => {
                      onChange(true);
                      setShowKvkkModal(false);
                    }}
                  />
                </>
              )}
            />

            <Button
              title={t('auth.register')}
              onPress={handleSubmit(onSubmit)}
              loading={loading}
              size="lg"
              style={styles.submitButton}
            />
          </View>

          {/* Login Link */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              {t('auth.hasAccount')}{' '}
            </Text>
            <Pressable onPress={() => router.push('/(auth)/login')}>
              <Text style={[styles.linkText, { color: colors.primary }]}>
                {t('auth.login')}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CountryPickerModal
        visible={showCountryPicker}
        onClose={() => setShowCountryPicker(false)}
        onSelect={setSelectedCountry}
        selectedCountryCode={selectedCountry.code}
      />
    </SafeAreaView >
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
    marginBottom: RSpacing.md,
  },
  backText: {
    fontSize: RFontSizes.lg,
    fontWeight: '500',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: RSpacing.lg,
  },
  logo: {
    width: 60,
    height: 60,
  },
  title: {
    fontSize: RFontSizes.xxl,
    fontWeight: '700',
    marginBottom: RSpacing.xs,
  },
  subtitle: {
    fontSize: RFontSizes.lg,
    marginBottom: RSpacing.lg,
  },
  form: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    gap: RSpacing.md,
  },
  nameField: {
    flex: 1,
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
});
