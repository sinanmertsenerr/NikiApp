import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  useColorScheme,
  TextInput,
} from 'react-native';
import { Alert } from '../../src/utils/alert';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

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

type RegisterStep = 'form' | 'phone-verify';

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

const CODE_LENGTH = 6;

export default function RegisterScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const { theme, selectedBrand } = useSettingsStore();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<RegisterStep>('form');
  // Replaced single string smsCode with array for 6-digit input UI
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const [formData, setFormData] = useState<RegisterForm | null>(null);

  const isDark = theme === 'dark' || (theme === 'system' && colorScheme === 'dark');
  const colors = isDark ? DarkColors : Colors;
  const brand = BRANDS[selectedBrand];

  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showKvkkModal, setShowKvkkModal] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country>(DEFAULT_COUNTRY);

  // Phone verification state
  const [phoneAuthLoading, setPhoneAuthLoading] = useState(false);
  const [phoneAuthError, setPhoneAuthError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  // Format phone number as (555) 123 45 67
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

  const unformatPhoneNumber = (text: string): string => {
    return text.replace(/\D/g, '');
  };

  const registerSchema = createRegisterSchema(t, selectedCountry.code);

  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
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

  // Handle OTP Code Changes (Copied from verify-email.tsx logic)
  const handleCodeChange = (text: string, index: number) => {
    const newCode = [...code];

    // Handle paste
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

    // Auto-focus next input
    if (text && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Step 1: Form submission -> Send SMS code via backend
  const onFormSubmit = async (data: RegisterForm) => {
    setFormData(data);
    setPhoneAuthLoading(true);
    setPhoneAuthError(null);

    try {
      const fullPhoneNumber = `${selectedCountry.dialCode}${data.phone}`;
      await authService.sendPhoneCode(fullPhoneNumber);
      setStep('phone-verify');
      setCode(Array(CODE_LENGTH).fill('')); // Reset code on new send
      setCountdown(60);
      // Start countdown timer
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      setPhoneAuthError(error.message);
      Alert.alert(t('common.error'), error.message);
    } finally {
      setPhoneAuthLoading(false);
    }
  };

  // Step 2: Verify SMS code via backend -> Register
  const onVerifyCode = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== CODE_LENGTH) {
      Alert.alert(t('common.error'), t('auth.enterSixDigitCode'));
      return;
    }

    if (!formData) return;

    setPhoneAuthLoading(true);
    setPhoneAuthError(null);

    try {
      const fullPhoneNumber = `${selectedCountry.dialCode}${formData.phone}`;

      // Verify phone code
      await authService.verifyPhoneCode(fullPhoneNumber, fullCode);

      // Phone verified, now register with backend
      setLoading(true);
      await authService.register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: fullPhoneNumber,
        email: formData.email,
        password: formData.password,
        kvkkAccepted: formData.kvkkAccepted,
        phoneVerified: true,
      });

      // Success - go to login screen
      Alert.alert(
        t('auth.registerSuccess'),
        t('auth.phoneVerified'),
        [
          {
            text: t('auth.login'),
            onPress: () => router.replace('/(auth)/login'),
          },
        ]
      );
    } catch (error: any) {
      setPhoneAuthError(error.message);
      Alert.alert(t('common.error'), error.message);
      // Clear code on error if needed, but usually better to let user correct it
    } finally {
      setPhoneAuthLoading(false);
      setLoading(false);
    }
  };

  // Resend SMS code via backend
  const onResendCode = async () => {
    if (countdown > 0 || !formData) return;

    setPhoneAuthLoading(true);
    try {
      const fullPhoneNumber = `${selectedCountry.dialCode}${formData.phone}`;
      await authService.sendPhoneCode(fullPhoneNumber);
      setCountdown(60);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    } finally {
      setPhoneAuthLoading(false);
    }
  };

  // Go back to form step
  const goBackToForm = () => {
    setStep('form');
    setCode(Array(CODE_LENGTH).fill(''));
    setPhoneAuthError(null);
    setCountdown(0);
  };

  // Render phone verification step
  if (step === 'phone-verify') {
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
            <Pressable onPress={goBackToForm} style={styles.backButton}>
              <Text style={[styles.backText, { color: colors.primary }]}>← {t('common.back')}</Text>
            </Pressable>

            {/* Icon */}
            <View style={styles.verifyIconContainer}>
              <View style={[styles.verifyIconCircle, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="phone-portrait-outline" size={48} color={colors.primary} />
              </View>
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: colors.text, textAlign: 'center' }]}>
              {t('auth.phoneVerification')}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary, textAlign: 'center' }]}>
              {t('auth.phoneVerificationDesc')}
            </Text>
            <Text style={[styles.phoneDisplay, { color: colors.primary }]}>
              {selectedCountry.dialCode} {formData?.phone ? formatPhoneNumber(formData.phone) : ''}
            </Text>

            {/* OTP Input (Split Boxes) */}
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

            {/* Error Message */}
            {phoneAuthError && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {phoneAuthError}
              </Text>
            )}

            {/* Verify Button */}
            <Button
              title={t('auth.verifyPhone')}
              onPress={onVerifyCode}
              loading={phoneAuthLoading || loading}
              size="lg"
              style={styles.verifyButton}
              disabled={code.join('').length !== CODE_LENGTH}
            />

            {/* Resend Code */}
            <View style={styles.resendContainer}>
              <Text style={[styles.resendText, { color: colors.textSecondary }]}>
                {t('auth.didNotReceiveCode')}{' '}
              </Text>
              {countdown > 0 ? (
                <Text style={[styles.countdownText, { color: colors.textSecondary }]}>
                  {t('auth.waitSeconds', { seconds: countdown })}
                </Text>
              ) : (
                <Pressable onPress={onResendCode}>
                  <Text style={[styles.resendLink, { color: colors.primary }]}>
                    {t('auth.resendSmsCode')}
                  </Text>
                </Pressable>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Render form step
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
              source={isDark ? brand.logoLight : brand.logo}
              style={styles.logo}
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

            {/* Phone Auth Error */}
            {phoneAuthError && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {phoneAuthError}
              </Text>
            )}

            <Button
              title={t('auth.sendSmsCode')}
              onPress={handleSubmit(onFormSubmit)}
              loading={phoneAuthLoading}
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
  // Phone verification styles
  verifyIconContainer: {
    alignItems: 'center',
    marginBottom: RSpacing.lg, // Changed to match verify-email spacing
  },
  verifyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneDisplay: {
    fontSize: RFontSizes.lg,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: RSpacing.xl,
  },
  // Updated Code Input Styles to match verify-email.tsx
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: RSpacing.sm,
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
  verifyButton: {
    marginBottom: RSpacing.lg,
  },
  errorText: {
    fontSize: RFontSizes.sm,
    textAlign: 'center',
    marginBottom: RSpacing.md,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: RSpacing.xl, // Updated spacing
    flexWrap: 'wrap',
  },
  resendText: {
    fontSize: RFontSizes.md,
  },
  resendLink: {
    fontSize: RFontSizes.md,
    fontWeight: '600',
  },
  countdownText: {
    fontSize: RFontSizes.md,
    fontWeight: '500',
  },
});
