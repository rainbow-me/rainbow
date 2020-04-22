import 'react-native-gesture-handler';
import './global';
import './shim';

import lang from 'i18n-js';
import { language } from 'react-native-languages';
// eslint-disable-next-line no-unused-vars,import/default
import App from './src/App';
import { resources } from './src/languages';

// Languages (i18n)
lang.defaultLocale = 'en';
lang.locale = language;
lang.fallbacks = true;

lang.translations = Object.assign(
  {},
  ...Object.keys(resources).map(key => ({
    [key]: resources[key].translation,
  }))
);
