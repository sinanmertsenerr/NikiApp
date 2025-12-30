import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  useColorScheme,
} from 'react-native';
import { Colors, DarkColors, RSpacing, RFontSizes, BorderRadius } from '../../constants/theme';
import { useSettingsStore } from '../../stores/settingsStore';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const colorScheme = useColorScheme();
  const { theme } = useSettingsStore();
  const isDark = theme === 'dark' || (theme === 'system' && colorScheme === 'dark');
  const colors = isDark ? DarkColors : Colors;

  const isDisabled = disabled || loading;

  const getBackgroundColor = () => {
    if (isDisabled) return colors.backgroundTertiary;
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'secondary':
        return colors.secondary;
      case 'outline':
      case 'ghost':
        return 'transparent';
      default:
        return colors.primary;
    }
  };

  const getTextColor = () => {
    if (isDisabled) return colors.textTertiary;
    switch (variant) {
      case 'primary':
        return colors.textInverse;
      case 'secondary':
        return colors.textInverse;
      case 'outline':
        return colors.primary;
      case 'ghost':
        return colors.primary;
      default:
        return colors.textInverse;
    }
  };

  const getBorderColor = () => {
    if (variant === 'outline') {
      return isDisabled ? colors.border : colors.primary;
    }
    return 'transparent';
  };

  const getPadding = () => {
    switch (size) {
      case 'sm':
        return { paddingVertical: RSpacing.sm, paddingHorizontal: RSpacing.md };
      case 'lg':
        return { paddingVertical: RSpacing.lg, paddingHorizontal: RSpacing.xl };
      default:
        return { paddingVertical: RSpacing.md, paddingHorizontal: RSpacing.lg };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return RFontSizes.md;
      case 'lg':
        return RFontSizes.xl;
      default:
        return RFontSizes.lg;
    }
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        getPadding(),
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outline' ? 1.5 : 0,
          opacity: pressed && !isDisabled ? 0.8 : 1,
        },
        style,
      ]}
      android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <Text
          style={[
            styles.text,
            { color: getTextColor(), fontSize: getFontSize() },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    fontWeight: '600',
  },
});
