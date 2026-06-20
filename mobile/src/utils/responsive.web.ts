// Responsive scaling — WEB.
// Mirrors src/utils/responsive.ts but clamps the design width to a phone frame.
// On web the app renders inside a centered ~430px column (see MobileFrame.web.tsx),
// yet Dimensions.get('window') still returns the full browser viewport — which on
// desktop would scale every wp()/fp() value (and the theme's RSpacing/RFontSizes
// fed to ~40 files) far too large. Clamping the width here fixes the whole app in
// one place. Native (responsive.ts) is left byte-for-byte unchanged.
import { Dimensions, PixelRatio } from 'react-native';

// Base dimensions (iPhone 14 Pro design)
const BASE_WIDTH = 393;
const BASE_HEIGHT = 852;

// Keep scaling within phone bounds regardless of the real browser viewport.
const MAX_PHONE_WIDTH = 430;
const MAX_PHONE_HEIGHT = 932;

const win = Dimensions.get('window');
const SCREEN_WIDTH = Math.min(win.width, MAX_PHONE_WIDTH);
const SCREEN_HEIGHT = Math.min(win.height, MAX_PHONE_HEIGHT);

// Scale based on width
const widthScale = SCREEN_WIDTH / BASE_WIDTH;
const heightScale = SCREEN_HEIGHT / BASE_HEIGHT;

// Use the smaller scale to ensure content fits on all devices
const scale = Math.min(widthScale, heightScale);

export const wp = (size: number): number => {
    return Math.round(PixelRatio.roundToNearestPixel(size * widthScale));
};

export const hp = (size: number): number => {
    return Math.round(PixelRatio.roundToNearestPixel(size * heightScale));
};

export const fp = (size: number): number => {
    const newSize = size * (1 + (scale - 1) * 0.5);
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

export const responsive = <T>(small: T, medium: T, large: T): T => {
    if (SCREEN_WIDTH < 375) return small;
    if (SCREEN_WIDTH < 414) return medium;
    return large;
};

export const isSmallDevice = SCREEN_WIDTH < 375;
export const isLargeDevice = SCREEN_WIDTH >= 414;
export const isTablet = SCREEN_WIDTH >= 768;

// Screen dimensions (clamped to the phone frame on web)
export const screenWidth = SCREEN_WIDTH;
export const screenHeight = SCREEN_HEIGHT;

export const breakpoints = {
    small: 375,
    medium: 414,
    large: 768,
};

export const responsiveSpacing = {
    xs: wp(4),
    sm: wp(8),
    md: wp(12),
    lg: wp(16),
    xl: wp(24),
    xxl: wp(32),
};

export const responsiveFontSizes = {
    xs: fp(11),
    sm: fp(13),
    md: fp(15),
    lg: fp(17),
    xl: fp(20),
    xxl: fp(24),
    xxxl: fp(32),
};

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
