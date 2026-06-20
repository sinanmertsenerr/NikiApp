import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import tr from './tr.json';
import en from './en.json';

const resources = {
  tr: { translation: tr },
  en: { translation: en },
};

// Default to the device language when it's one we support; otherwise Turkish
// (primary audience). A persisted choice in settingsStore overrides this later.
const deviceLanguage = Localization.getLocales()[0]?.languageCode;
const defaultLanguage = deviceLanguage === 'en' ? 'en' : 'tr';

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
