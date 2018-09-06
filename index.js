import lang, { getLanguages } from 'react-native-i18n';
import { resources } from 'balance-common';

import './global';
import './shim';

// eslint-disable-next-line
import App from './src/App';

// Languages (i18n)
lang.defaultLocale = 'en';
lang.fallbacks = true;

lang.translations = Object.assign(
  {},
  ...Object.keys(resources).map((key, index) => ({ [key]: resources[key].translation })),
);

// eslint-disable-next-line
getLanguages().then(languages => lang.locale = languages[0]);
