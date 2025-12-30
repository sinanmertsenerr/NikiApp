import { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Pressable,
  TextInputProps,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, DarkColors, RSpacing, RFontSizes, BorderRadius } from '../../constants/theme';
import { useSettingsStore } from '../../stores/settingsStore';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
  prefix?: React.ReactNode;
  onPressPrefix?: () => void;
  textContentType?: TextInputProps['textContentType'];
}

export function Input({
  label,
  error,
  leftIcon,
  isPassword,
  prefix,
  onPressPrefix,
  textContentType,
  style,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const colorScheme = useColorScheme();
  const { theme } = useSettingsStore();
  const isDark = theme === 'dark' || (theme === 'system' && colorScheme === 'dark');
  const colors = isDark ? DarkColors : Colors;

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      )}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.backgroundSecondary,
            borderColor: error
              ? colors.error
              : isFocused
                ? colors.primary
                : colors.border,
          },
        ]}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={colors.textSecondary}
            style={styles.leftIcon}
          />
        )}
        {prefix && (
          onPressPrefix ? (
            <Pressable onPress={onPressPrefix} style={styles.prefixContainer}>
              <Text style={[styles.prefix, { color: colors.text }]}>{prefix}</Text>
              <Ionicons name="chevron-down" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
            </Pressable>
          ) : (
            <Text style={[styles.prefix, { color: colors.text }]}>{prefix}</Text>
          )
        )}
        <TextInput
          style={[
            styles.input,
            { color: colors.text },
            // leftIcon && styles.inputWithIcon, // removed this as it might conflict with prefix layout, flex should handle it
            style,
          ]}
          placeholderTextColor={colors.textTertiary}
          secureTextEntry={isPassword && !showPassword}
          textContentType={textContentType || (isPassword ? 'password' : undefined)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {isPassword && (
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textSecondary}
            />
          </Pressable>
        )}
      </View>
      {error && (
        <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: RSpacing.md,
  },
  label: {
    fontSize: RFontSizes.md,
    fontWeight: '500',
    marginBottom: RSpacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: RSpacing.md,
  },
  input: {
    flex: 1,
    fontSize: RFontSizes.lg,
    paddingVertical: RSpacing.md,
  },
  inputWithIcon: {
    marginLeft: RSpacing.sm,
  },
  leftIcon: {
    marginRight: RSpacing.xs,
  },
  prefixContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: RSpacing.xs,
  },
  prefix: {
    fontSize: RFontSizes.lg,
    fontWeight: '500',
    marginTop: 0,
    marginRight: 4,
  },
  eyeButton: {
    padding: RSpacing.xs,
  },
  error: {
    fontSize: RFontSizes.sm,
    marginTop: RSpacing.xs,
  },
});
