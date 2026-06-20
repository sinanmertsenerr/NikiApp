import { create } from 'zustand';
import { Platform } from 'react-native';
import * as SecureStore from '../services/secureStore';
import { Alert } from '@/utils/alert';
import { STORAGE_KEYS } from '../constants/api';
import { socketService } from '../services/socketService';
import i18n from '../i18n';

// Web only: attach a cross-tab auth sync once. When tokens are cleared in another
// browser tab (logout), localStorage fires a 'storage' event here so this tab
// mirrors the logout instead of staying on authenticated screens with a dead session.
let webStorageSyncAttached = false;

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'customer' | 'admin' | 'super_admin';
  avatarUrl?: string;
  phone?: string;
  emailVerified: boolean;
  isActive: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setTokens: (tokens: AuthTokens | null) => Promise<void>;
  login: (user: User, tokens: AuthTokens) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  setUser: (user) => {
    set({ user, isAuthenticated: !!user });
  },

  setTokens: async (tokens) => {
    if (tokens) {
      await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
      await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
    } else {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    }
    set({ tokens });
  },

  login: async (user, tokens) => {
    await get().setTokens(tokens);
    set({ user, isAuthenticated: true });

    // Register auth failure callback to auto-logout on 401
    socketService.onAuthFailure(() => {
      console.log('[Auth] Session expired - auto logging out');
      Alert.alert(
        i18n.t('auth.sessionExpired', 'Session Expired'),
        i18n.t('auth.sessionExpiredMessage', 'Your session has expired. Please login again.'),
        [{ text: i18n.t('common.ok', 'OK') }]
      );
      get().logout();
    });

    // Connect socket after login
    socketService.connect();
  },

  logout: async () => {
    // Disconnect socket before logout
    socketService.disconnect();
    await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    // Clear brand selection flag so user selects brand on next login
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.removeItem(STORAGE_KEYS.HAS_SELECTED_BRAND);
    set({ user: null, tokens: null, isAuthenticated: false });
  },

  initialize: async () => {
    set({ isLoading: true });

    // Web: mirror logout across tabs.
    if (Platform.OS === 'web' && typeof window !== 'undefined' && !webStorageSyncAttached) {
      webStorageSyncAttached = true;
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEYS.ACCESS_TOKEN && e.newValue === null && get().isAuthenticated) {
          socketService.disconnect();
          set({ user: null, tokens: null, isAuthenticated: false });
        }
      });
    }

    try {
      const accessToken = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);

      if (accessToken && refreshToken) {
        set({
          tokens: { accessToken, refreshToken, expiresIn: 0 },
          isAuthenticated: true,
        });

        // Try to fetch current user from API
        try {
          const api = require('../services/api').default;
          const { API_ENDPOINTS } = require('../constants/api');
          const response = await api.get(API_ENDPOINTS.AUTH.ME);
          const user = response.data.data.user;
          set({ user });
        } catch (userError) {
          console.warn('[Auth] Failed to fetch user, session may have expired:', userError);
          // If we can't fetch user, tokens might be invalid - logout
          await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
          await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          await AsyncStorage.removeItem(STORAGE_KEYS.HAS_SELECTED_BRAND);
          set({ user: null, tokens: null, isAuthenticated: false });
        }

        // Register auth failure callback to auto-logout on 401
        socketService.onAuthFailure(() => {
          console.log('[Auth] Session expired - auto logging out');
          Alert.alert(
            i18n.t('auth.sessionExpired', 'Session Expired'),
            i18n.t('auth.sessionExpiredMessage', 'Your session has expired. Please login again.'),
            [{ text: i18n.t('common.ok', 'OK') }]
          );
          get().logout();
        });

        // Connect socket after restoring session
        socketService.connect();
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
    } finally {
      set({ isLoading: false, isInitialized: true });
    }
  },

  updateUser: (updates) => {
    const currentUser = get().user;
    if (currentUser) {
      set({ user: { ...currentUser, ...updates } });
    }
  },
}));
