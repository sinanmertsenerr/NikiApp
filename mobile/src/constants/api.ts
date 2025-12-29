// API Configuration
import Constants from 'expo-constants';

// ============================================================
// AUTOMATIC IP DETECTION FOR DEVELOPMENT
// ============================================================
// This automatically detects your computer's IP address
// from the Expo dev server, so you don't need to hardcode it!
// 
// OLD APPROACH (commented out - fallback if needed):
// const BACKEND_HOST = __DEV__
//   ? 'http://172.20.10.8:3000'
//   : 'https://api.nikicoffee.com';
// ============================================================

const getDevServerHost = (): string => {
  // Try to get the debuggerHost from Expo Constants (works with expo start)
  const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost;

  if (debuggerHost) {
    // debuggerHost is like "192.168.1.5:8081", we just need the IP part
    const host = debuggerHost.split(':')[0];
    return `http://${host}:3000`;
  }

  // Fallback to localhost for simulators
  return 'http://localhost:3000';
};

const BACKEND_HOST = __DEV__
  ? getDevServerHost()
  : 'https://api.niki.ieu.app';

export const API_BASE_URL = `${BACKEND_HOST}/api/v1`;

// Helper to get full image URL from relative path
export const getFullImageUrl = (relativePath: string | null | undefined): string | null => {
  if (!relativePath) return null;
  // If already a full URL, return as is
  if (relativePath.startsWith('http')) return relativePath;
  // Otherwise prepend backend host
  return `${BACKEND_HOST}${relativePath}`;
};

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    VERIFY_EMAIL: '/auth/verify-email',
    RESEND_VERIFICATION: '/auth/resend-verification',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },

  // Users
  USERS: {
    PROFILE: '/users/profile',
    SETTINGS: '/users/settings',
    STATS: '/users/stats',
    BADGES: '/users/badges',
    AVATAR: '/users/avatar',
  },

  // Wallet
  WALLET: {
    BASE: '/wallet',
    TRANSACTIONS: '/wallet/transactions',
    QR: '/wallet/qr',
  },

  // Campaigns
  CAMPAIGNS: {
    BASE: '/campaigns',
    MY: '/campaigns/my',
    AVAILABLE: '/campaigns/available',
  },

  // Wheel
  WHEEL: {
    STATUS: '/wheel/status',
    SPIN: '/wheel/spin',
    HISTORY: '/wheel/history',
  },

  // Menu
  MENU: {
    CATEGORIES: '/menu/categories',
    PRODUCTS: '/menu/products',
  },

  // Notifications
  NOTIFICATIONS: {
    BASE: '/notifications',
    UNREAD_COUNT: '/notifications/unread-count',
    MARK_READ: '/notifications', // + /:id/read
    MARK_ALL_READ: '/notifications/mark-all-read',
  },

  // Upload
  UPLOAD: {
    AVATAR: '/upload/avatar',
    PRODUCT: '/upload/product', // + /:productId
  },
} as const;

// Request timeouts
export const API_TIMEOUT = 30000; // 30 seconds

// Storage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
  SELECTED_BRAND: 'selected_brand',
  HAS_SELECTED_BRAND: 'has_selected_brand',
  ONBOARDING_COMPLETED: 'onboarding_completed',
} as const;
