// API Configuration
import { Platform } from 'react-native';

// Native always resolves to the live host (byte-for-byte unchanged). The web
// build may override it via EXPO_PUBLIC_API_URL (e.g. http://localhost:3000 in
// dev); that origin must also be whitelisted in the backend REST CORS + the
// websocket gateway allowlist. Both API_BASE_URL and getFullImageUrl derive from
// this single host so API calls and /uploads images always share an origin.
const LIVE_HOST = 'https://nikiapi.sinansener.com';
const BACKEND_HOST =
  Platform.OS === 'web' ? (process.env.EXPO_PUBLIC_API_URL || LIVE_HOST) : LIVE_HOST;

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
    SEND_PHONE_CODE: '/auth/send-phone-code',
    VERIFY_PHONE_CODE: '/auth/verify-phone-code',
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
  THEME: 'theme',
  LANGUAGE: 'language',
  SELECTED_BRAND: 'selected_brand',
  HAS_SELECTED_BRAND: 'has_selected_brand',
} as const;
