import lang from 'i18n-js';
import english from './_english.json';
import french from './_french.json';

export const resources = {
  en: english,
  fr: french,
};

export const supportedLanguages = {
  en: 'English',
  fr: 'French',
};

export const updateLanguageLocale = code => {
  lang.locale = code;
};

// Configure languages
lang.defaultLocale = 'en';
lang.locale = 'en';
lang.fallbacks = true;
lang.translations = Object.assign(
  {},
  ...Object.keys(resources).map(key => ({
    [key]: resources[key].translation,
  }))
);
