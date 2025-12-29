import { Dimensions, PixelRatio, Platform } from 'react-native';

// Base dimensions (iPhone 14 Pro design)
const BASE_WIDTH = 393;
const BASE_HEIGHT = 852;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Scale based on width
const widthScale = SCREEN_WIDTH / BASE_WIDTH;
const heightScale = SCREEN_HEIGHT / BASE_HEIGHT;

// Use the smaller scale to ensure content fits on all devices
const scale = Math.min(widthScale, heightScale);

/**
 * Scales a size value based on screen width
 * Use for horizontal measurements: width, marginHorizontal, paddingHorizontal, etc.
 */
export const wp = (size: number): number => {
    return Math.round(PixelRatio.roundToNearestPixel(size * widthScale));
};

/**
 * Scales a size value based on screen height
 * Use for vertical measurements: height, marginVertical, paddingVertical, etc.
 */
export const hp = (size: number): number => {
    return Math.round(PixelRatio.roundToNearestPixel(size * heightScale));
};

/**
 * Scales font size with moderate scaling to avoid extreme sizes
 * Uses a moderated scale (0.5 factor) for better readability
 */
export const fp = (size: number): number => {
    const newSize = size * (1 + (scale - 1) * 0.5);
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * Returns a value based on screen size category
 * small: < 375px, medium: 375-414px, large: > 414px
 */
export const responsive = <T>(small: T, medium: T, large: T): T => {
    if (SCREEN_WIDTH < 375) return small;
    if (SCREEN_WIDTH < 414) return medium;
    return large;
};

/**
 * Returns true if device is a small screen (e.g., iPhone SE)
 */
export const isSmallDevice = SCREEN_WIDTH < 375;

/**
 * Returns true if device is a large screen (e.g., iPhone Pro Max, tablets)
 */
export const isLargeDevice = SCREEN_WIDTH >= 414;

/**
 * Returns true if device is a tablet
 */
export const isTablet = SCREEN_WIDTH >= 768;

// Screen dimensions
export const screenWidth = SCREEN_WIDTH;
export const screenHeight = SCREEN_HEIGHT;

// Breakpoints
export const breakpoints = {
    small: 375,
    medium: 414,
    large: 768,
};

/**
 * Moderately scaled spacing values
 */
export const responsiveSpacing = {
    xs: wp(4),
    sm: wp(8),
    md: wp(12),
    lg: wp(16),
    xl: wp(24),
    xxl: wp(32),
};

/**
 * Moderately scaled font sizes
 */
export const responsiveFontSizes = {
    xs: fp(11),
    sm: fp(13),
    md: fp(15),
    lg: fp(17),
    xl: fp(20),
    xxl: fp(24),
    xxxl: fp(32),
};

/**
 * Icon sizes based on screen size
 */
export const responsiveIconSizes = {
    sm: responsive(16, 18, 20),
    md: responsive(20, 22, 24),
    lg: responsive(24, 28, 32),
    xl: responsive(32, 36, 40),
};

export default {
    wp,
    hp,
    fp,
    responsive,
    isSmallDevice,
    isLargeDevice,
    isTablet,
    screenWidth,
    screenHeight,
    breakpoints,
    responsiveSpacing,
    responsiveFontSizes,
    responsiveIconSizes,
};
