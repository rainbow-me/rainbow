import 'react-native-gesture-handler';
import './global';
import './shim';

import RNLanguages from 'react-native-languages';
import lang from 'i18n-js';
import { resources } from './src/languages';

// eslint-disable-next-line no-unused-vars,import/default
import App from './src/App';

// Languages (i18n)
lang.defaultLocale = 'en';
lang.locale = RNLanguages.language;
lang.fallbacks = true;

lang.translations = Object.assign(
  {},
  ...Object.keys(resources).map(key => ({
    [key]: resources[key].translation,
  }))
);
