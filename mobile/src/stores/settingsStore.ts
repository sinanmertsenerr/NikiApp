import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/api';
import { BrandType, DEFAULT_BRAND } from '../constants/brands';
import i18n from '../i18n';

type ThemeMode = 'light' | 'dark' | 'system';
type Language = 'tr' | 'en';

interface SettingsState {
  theme: ThemeMode;
  language: Language;
  selectedBrand: BrandType;
  hasSelectedBrand: boolean;
  notificationsEnabled: boolean;
  isInitialized: boolean;

  // Actions
  setTheme: (theme: ThemeMode) => Promise<void>;
  setLanguage: (language: Language) => Promise<void>;
  setSelectedBrand: (brand: BrandType) => Promise<void>;
  setNotificationsEnabled: (enabled: boolean) => void;
  clearBrandSelection: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: 'system',
  language: 'tr',
  selectedBrand: DEFAULT_BRAND,
  hasSelectedBrand: false,
  notificationsEnabled: true,
  isInitialized: false,

  setTheme: async (theme) => {
    await AsyncStorage.setItem(STORAGE_KEYS.THEME, theme);
    set({ theme });
  },

  setLanguage: async (language) => {
    await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, language);
    // Keep the store as the single source of truth for the active language.
    i18n.changeLanguage(language);
    set({ language });
  },

  setSelectedBrand: async (brand) => {
    await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_BRAND, brand);
    await AsyncStorage.setItem(STORAGE_KEYS.HAS_SELECTED_BRAND, 'true');
    set({ selectedBrand: brand, hasSelectedBrand: true });
  },

  clearBrandSelection: async () => {
    await AsyncStorage.removeItem(STORAGE_KEYS.HAS_SELECTED_BRAND);
    set({ hasSelectedBrand: false });
  },

  setNotificationsEnabled: (enabled) => {
    set({ notificationsEnabled: enabled });
  },

  initialize: async () => {
    try {
      const [theme, language, brand] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.THEME),
        AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE),
        AsyncStorage.getItem(STORAGE_KEYS.SELECTED_BRAND),
      ]);

      // No saved choice → keep the device-derived default already applied in i18n.
      const savedLanguage = (language as Language) || (i18n.language as Language) || 'tr';
      if (['tr', 'en'].includes(savedLanguage)) {
        i18n.changeLanguage(savedLanguage);
      }

      set({
        theme: (theme as ThemeMode) || 'system',
        language: savedLanguage,
        selectedBrand: (brand as BrandType) || DEFAULT_BRAND,
        // Only one brand is active, so auto-select it and skip the brand-select
        // wall (no friction). The screen stays reachable from Profile ("change
        // brand") for the multi-brand future.
        hasSelectedBrand: true,
        isInitialized: true,
      });
    } catch (error) {
      console.error('Failed to initialize settings:', error);
      set({ isInitialized: true });
    }
  },
}));

