// Niki Coffee App Theme Constants
import { fp, wp, responsive, isSmallDevice } from '../utils/responsive';

export const Colors = {
  // Primary - Niki Brand (Black cat theme)
  primary: '#000000',
  primaryLight: '#333333',
  primaryDark: '#000000',

  // Secondary - Coffee tones
  secondary: '#6B4423',
  secondaryLight: '#8B5A2B',
  secondaryDark: '#4A2F17',

  // Background
  background: '#FFFFFF',
  backgroundSecondary: '#F5F5F5',
  backgroundTertiary: '#EEEEEE',

  // Text
  text: '#1A1A1A',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textInverse: '#FFFFFF',

  // Status colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',

  // Border
  border: '#E0E0E0',
  borderLight: '#F0F0F0',

  // Card
  card: '#FFFFFF',
  cardShadow: 'rgba(0, 0, 0, 0.1)',
};

export const DarkColors = {
  ...Colors,
  // Primary inverted for dark mode
  primary: '#FFFFFF',
  primaryLight: '#E0E0E0',
  primaryDark: '#CCCCCC',

  background: '#121212',
  backgroundSecondary: '#1E1E1E',
  backgroundTertiary: '#2D2D2D',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textTertiary: '#808080',
  textInverse: '#000000',
  border: '#333333',
  borderLight: '#2D2D2D',
  card: '#1E1E1E',
  cardShadow: 'rgba(255, 255, 255, 0.1)',
};

// Static spacing (original)
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Responsive spacing (scaled based on screen width)
export const RSpacing = {
  xs: wp(4),
  sm: wp(8),
  md: wp(16),
  lg: wp(24),
  xl: wp(32),
  xxl: wp(48),
};

// Static font sizes (original)
export const FontSizes = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 24,
  xxxl: 32,
  title: 28,
  header: 20,
};

// Responsive font sizes (scaled based on screen)
export const RFontSizes = {
  xs: fp(10),
  sm: fp(12),
  md: fp(14),
  lg: fp(16),
  xl: fp(18),
  xxl: fp(24),
  xxxl: fp(32),
  title: fp(28),
  header: fp(20),
};

export const FontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};

// Responsive border radius
export const RBorderRadius = {
  sm: wp(4),
  md: wp(8),
  lg: wp(12),
  xl: wp(16),
  xxl: wp(24),
  full: 9999,
};

// Icon sizes
export const IconSizes = {
  sm: responsive(16, 18, 20),
  md: responsive(20, 22, 24),
  lg: responsive(24, 28, 32),
  xl: responsive(32, 36, 40),
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

// Export responsive utilities for easy access
export { isSmallDevice, responsive } from '../utils/responsive';
