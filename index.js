import './global';
import './shim';

/* eslint-disable import/first */
import RNLanguages from 'react-native-languages';
import lang from 'i18n-js';
import { resources } from './src/languages';

// eslint-disable-next-line
import App from './src/App';

// Languages (i18n)
lang.defaultLocale = 'en';
lang.locale = RNLanguages.language;
lang.fallbacks = true;

lang.translations = Object.assign(
  {},
  ...Object.keys(resources).map((key, index) => ({
    [key]: resources[key].translation,
  })),
);
