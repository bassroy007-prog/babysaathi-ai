import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en';
import hi from './locales/hi';
import bn from './locales/bn';
import pa from './locales/pa';
import ta from './locales/ta';
import te from './locales/te';
import mr from './locales/mr';
import gu from './locales/gu';
import kn from './locales/kn';
import ml from './locales/ml';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    bn: { translation: bn },
    pa: { translation: pa },
    ta: { translation: ta },
    te: { translation: te },
    mr: { translation: mr },
    gu: { translation: gu },
    kn: { translation: kn },
    ml: { translation: ml },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: 'v3',
});

export default i18n;
