import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import tr from './tr.json';
import en from './en.json';

const resources = {
  tr: { translation: tr },
  en: { translation: en },
};

// Get device language - default to English if not Turkish
const deviceLanguage = Localization.getLocales()[0]?.languageCode;
// Force Turkish as default if that's the primary audience, or uncomment line below for dynamic
// const defaultLanguage = deviceLanguage === 'tr' ? 'tr' : 'en';
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
