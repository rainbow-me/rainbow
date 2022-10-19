import lang from 'i18n-js';
import english from './_english.json';
import french from './_french.json';

import { simpleObjectProxy } from '@/languages/utils';

/**
 * Use English as our "template" for translations. All other translations
 * should match the objects and keys within the English translation.
 */
export type Translation = typeof english;

export enum Language {
  English = 'en',
  French = 'fr',
}

export const resources: {
  [key in Language]: Translation;
} = {
  en: english,
  // @ts-ignore
  fr: french,
};

export const supportedLanguages: {
  [key in Language]: string;
} = {
  en: 'English',
  fr: 'French',
};

// Configure languages
lang.defaultLocale = Language.English;
lang.locale = Language.English;
lang.fallbacks = true;
lang.translations = Object.assign(
  {},
  ...Object.keys(resources).map(key => ({
    [key]: resources[key as Language].translation,
  }))
);

export const updateLanguageLocale = (code: string) => {
  lang.locale = code;
};

/**
 * Returns a i18n string for a given object-keypath or string.
 *   `import * as i18n from '@/languages'`
 *
 * Type-safe usage:
 *   `i18n.translate(i18n.translations.account.hide)`
 *
 * Alternative standard usage:
 *   `i18n.translate('account.hide')`
 */
export function translate(keypath: string) {
  // @ts-expect-error
  return lang.t(keypath.__keypath__ || keypath);
}

/**
 * A proxied object used to generate keypaths for use with `i18n.translate` via
 *   `import * as i18n from '@/languages'`
 *
 * Type-safe usage:
 *   `i18n.translate(i18n.translations.account.hide)`
 *
 * Alternative standard usage:
 *   `i18n.translate('account.hide')`
 * `i18n-js`
 */
export const translations = simpleObjectProxy<Translation['translation']>(
  english['translation']
);
