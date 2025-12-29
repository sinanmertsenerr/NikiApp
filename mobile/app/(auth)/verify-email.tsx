import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  useColorScheme,
  Alert,
  Keyboard,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../src/components/ui/Button';
import { useAuthStore } from '../../src/stores/authStore';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { authService } from '../../src/services/authService';
import { Colors, DarkColors, Spacing, FontSizes, BorderRadius, Shadows, RSpacing, RFontSizes, isSmallDevice } from '../../src/constants/theme';
import { screenWidth as SCREEN_WIDTH } from '../../src/utils/responsive';

const CODE_LENGTH = 6;

export default function VerifyEmailScreen() {
  const { t } = useTranslation();
  const { email } = useLocalSearchParams<{ email: string }>();
  const colorScheme = useColorScheme();
  const { theme } = useSettingsStore();
  const { login } = useAuthStore();

  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const isDark = theme === 'dark' || (theme === 'system' && colorScheme === 'dark');
  const colors = isDark ? DarkColors : Colors;

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

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

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== CODE_LENGTH) {
      Alert.alert(t('common.error'), t('auth.enterSixDigitCode'));
      return;
    }

    setLoading(true);
    Keyboard.dismiss();

    try {
      const result = await authService.verifyEmail({
        email: email || '',
        code: fullCode,
      });
      await login(result.user, result.tokens);
      router.replace('/(tabs)/home');
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
      // Clear code on error
      setCode(Array(CODE_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await authService.resendVerification(email || '');
      setCountdown(60);
      Alert.alert(t('common.success'), t('auth.verificationCodeResent'));
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Back Button */}
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Text style={[styles.backText, { color: colors.primary }]}>← {t('common.back')}</Text>
      </Pressable>

      {/* Icon */}
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>📧</Text>
      </View>

      {/* Title */}
      <Text style={[styles.title, { color: colors.text }]}>
        {t('auth.verifyEmail')}
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        <Text style={{ fontWeight: '600' }}>{email}</Text> {t('auth.verificationCodeSentTo')}
      </Text>

      {/* OTP Input */}
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

      {/* Verify Button */}
      <Button
        title={t('auth.verify')}
        onPress={handleVerify}
        loading={loading}
        disabled={code.join('').length !== CODE_LENGTH}
        size="lg"
        style={styles.verifyButton}
      />

      {/* Resend */}
      <View style={styles.resendContainer}>
        <Text style={[styles.resendText, { color: colors.textSecondary }]}>
          {t('auth.didNotReceiveCode')}{' '}
        </Text>
        {countdown > 0 ? (
          <Text style={[styles.countdownText, { color: colors.textTertiary }]}>
            ({countdown} {t('common.seconds')})
          </Text>
        ) : (
          <Pressable onPress={handleResend} disabled={resendLoading}>
            <Text style={[styles.resendLink, { color: colors.primary }]}>
              {resendLoading ? t('common.sending') : t('auth.resendCode')}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Info */}
      <View style={[styles.infoBox, { backgroundColor: colors.backgroundSecondary }]}>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          ⏱️ {t('auth.codeExpires')}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: RSpacing.lg,
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
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: RSpacing.xl,
  },
  resendText: {
    fontSize: RFontSizes.md,
  },
  countdownText: {
    fontSize: RFontSizes.md,
  },
  resendLink: {
    fontSize: RFontSizes.md,
    fontWeight: '600',
  },
  infoBox: {
    padding: RSpacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  infoText: {
    fontSize: RFontSizes.sm,
  },
});
