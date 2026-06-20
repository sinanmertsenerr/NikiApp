import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from './secureStore';
import { API_BASE_URL, API_TIMEOUT, STORAGE_KEYS, API_ENDPOINTS } from '../constants/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ---------------------------------------------------------------------------
// Single-flight token refresh.
// On web the app fires many queries in parallel on load; if the access token is
// expired, every 401 would otherwise refresh independently. The backend rotates
// and single-uses refresh tokens, so concurrent refreshes destroy each other's
// freshly-minted session. We funnel all refreshes through ONE in-flight promise
// so concurrent 401s share a single refresh and all retry with its result.
// ---------------------------------------------------------------------------
let refreshPromise: Promise<string | null> | null = null;

async function performRefresh(): Promise<string | null> {
  const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
  if (!refreshToken) return null;

  // Use a bare axios call (not `api`) so this request never re-enters the 401
  // interceptor and recurses.
  const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`, {
    refreshToken,
  });

  const { accessToken, refreshToken: newRefreshToken } = response.data.data.tokens;
  await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
  return accessToken;
}

/**
 * Refresh the access token, coalescing concurrent callers onto one request.
 * Returns the new access token, or null if there is no refresh token to use.
 * Throws if the refresh request itself fails (e.g. refresh token rejected).
 */
export function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// Clear the session and route to login. Lazy `require` avoids an import cycle
// (authStore imports this module).
function handleAuthFailure(): void {
  try {
    const { useAuthStore } = require('@/stores/authStore');
    useAuthStore.getState().logout();
  } catch {
    // Fallback: at least clear tokens so subsequent requests are unauthenticated.
    SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
  }
  try {
    const { router } = require('expo-router');
    router.replace('/(auth)/login');
  } catch {
    /* navigation not ready — auth state change will drive the redirect */
  }
}

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If 401 and not already retrying
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const accessToken = await refreshAccessToken();
        if (accessToken) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
        // No refresh token available → session is over.
        handleAuthFailure();
      } catch (refreshError) {
        // Refresh failed (rotated/expired refresh token) → log out cleanly.
        handleAuthFailure();
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// Library/framework default messages that are technical/English — we replace
// these with a clear, localized, status-based message instead of showing them.
const GENERIC_SERVER_MESSAGES = ['Unauthorized', 'Forbidden', 'Internal server error', 'Bad Request', 'Not Found'];

// Backend business error codes -> localized keys. Backend messages are Turkish,
// so for non-Turkish users we localize known codes; Turkish users keep the
// richer backend message (it carries dynamic detail like attempts remaining).
const CODE_MESSAGE_KEYS: Record<string, string> = {
  INVALID_CREDENTIALS: 'errors.loginInvalid',
  ACCOUNT_LOCKED: 'errors.accountLocked',
  PHONE_NOT_VERIFIED: 'errors.phoneNotVerified',
};

/** Extract the backend's structured error code (e.g. 'PHONE_NOT_VERIFIED'), if any. */
export const getErrorCode = (error: unknown): string | undefined => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as any;
    if (data && typeof data === 'object' && typeof data.code === 'string') {
      return data.code;
    }
  }
  return undefined;
};

/**
 * Turn any thrown error into a clear, user-friendly, localized message.
 *
 * Handles the backend's three error body shapes — {message:string},
 * bare {code,message,...} (no statusCode), and {message:string[]} (validation) —
 * plus the cases the backend can't describe: no internet, request timeout,
 * server unreachable, rate limiting, and 4xx/5xx status codes. Prefers the
 * server's own (usually Turkish) message when it is a real user message;
 * otherwise falls back to a localized message keyed off the HTTP status.
 */
export const getErrorMessage = (error: unknown): string => {
  // Lazy require avoids any import-order issue with the i18n bootstrap.
  const i18n = (() => {
    try {
      return require('../i18n').default;
    } catch {
      return null;
    }
  })();
  const t = (key: string, opts?: Record<string, unknown>): string =>
    i18n ? (i18n.t(key, opts) as string) : key;
  const lang: string = i18n?.language || 'tr';

  if (axios.isAxiosError(error)) {
    // No response at all → connectivity problem (offline / timeout / unreachable).
    if (!error.response) {
      if (error.code === 'ECONNABORTED' || /timeout/i.test(error.message || '')) {
        return t('errors.timeout');
      }
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        return t('errors.serverUnreachable');
      }
      return t('errors.network');
    }

    const status = error.response.status;
    const data = error.response.data as any;
    const code: string | undefined =
      data && typeof data === 'object' && typeof data.code === 'string' ? data.code : undefined;

    // Extract a server-provided message across all three body shapes.
    let serverMsg: string | undefined;
    if (typeof data === 'string') {
      serverMsg = data;
    } else if (Array.isArray(data?.message)) {
      serverMsg = data.message.filter(Boolean).join('\n');
    } else if (typeof data?.message === 'string') {
      serverMsg = data.message;
    }

    // 429: prefer the server's Retry-After so we can tell the user how long.
    if (status === 429) {
      const retryAfter = Number(error.response.headers?.['retry-after']);
      if (Number.isFinite(retryAfter) && retryAfter > 0) {
        return t('errors.tooManyRequestsWait', { seconds: Math.ceil(retryAfter) });
      }
      return t('errors.tooManyRequests');
    }

    // Non-Turkish users: localize known backend codes (backend messages are TR).
    if (lang !== 'tr' && code && CODE_MESSAGE_KEYS[code]) {
      return t(CODE_MESSAGE_KEYS[code]);
    }

    const isUsableServerMsg =
      !!serverMsg &&
      !GENERIC_SERVER_MESSAGES.includes(serverMsg) &&
      !/throttlerexception/i.test(serverMsg);

    // The backend's own message (e.g. "E-posta veya şifre hatalı") is the most
    // specific — show it when it's a real message, not a framework default.
    if (isUsableServerMsg) {
      return serverMsg as string;
    }

    // Otherwise map the HTTP status to a clear localized message.
    switch (status) {
      case 401:
        return t('errors.sessionExpired');
      case 403:
        return t('errors.forbidden');
      case 404:
        return t('errors.notFound');
      case 413:
        return t('errors.fileTooLarge');
      default:
        return status >= 500 ? t('errors.server') : t('errors.unknown');
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }
  return t('errors.unknown');
};
