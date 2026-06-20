import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import tr from './tr.json';
import en from './en.json';

const resources = {
  tr: { translation: tr },
  en: { translation: en },
};

// Default to Turkish for EVERYONE (primary audience) — deterministic across all
// devices/browsers, and it matches settingsStore's default so the two never
// diverge. The user's persisted choice (settingsStore, applied on initialize)
// overrides this. This is the single source of truth; nothing else sets language.
const defaultLanguage = 'tr';

i18n.use(initReactI18next).init({
  resources,
  lng: defaultLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;
