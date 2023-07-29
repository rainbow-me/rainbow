import lang from 'i18n-js';
import english from './_english.json';
import french from './_french.json';
import japanese from './_japanese.json';

import { simpleObjectProxy } from '@/languages/utils';

/**
 * Use English as our "template" for translations. All other translations
 * should match the objects and keys within the English translation.
 */
export type Translation = typeof english;

export enum Language {
  English = 'en',
  French = 'fr',
  Japanese = 'jp',
}

export const resources: {
  [key in Language]: Translation;
} = {
  en: english,
  fr: french,
  jp: japanese,
};

export const supportedLanguages: {
  [key in Language]: string;
} = {
  en: 'English',
  fr: 'French',
  jp: 'Japanese',
};

// Configure languages
lang.defaultLocale = Language.Japanese;
lang.locale = Language.Japanese;
lang.fallbacks = true;
lang.translations = Object.assign(
  {},
  ...Object.keys(resources).map(key => ({
    [key]: resources[key as Language].translation,
  }))
);

export const updateLanguageLocale = (code: Language) => {
  lang.locale = code;
};

/**
 * Returns a i18n string for a given object-keypath or string
 * and optional template literal args.
 *   `import * as i18n from '@/languages'`
 *
 * Type-safe usage:
 *   `i18n.t(i18n.l.account.hide, { accountName: 'myAccount' })`
 *
 * Alternative standard usage:
 *   `i18n.t('account.hide', { accountName: 'myAccount' })`
 */
export function t(keypath: string, args?: { [key: string]: string | number }) {
  // if it's anything truthy, try __keypath__ or fall back to the value
  // otherwise let falsy values fall through
  // @ts-expect-error
  return lang.t(keypath ? keypath.__keypath__ || keypath : keypath, args);
}

/**
 * A proxied object used to generate keypaths for use with `i18n.translate` via
 *   `import * as i18n from '@/languages'`
 *
 * Type-safe usage:
 *   `i18n.t(i18n.l.account.hide)`
 *
 * Alternative standard usage:
 *   `i18n.t('account.hide')`
 */
export const l = simpleObjectProxy<Translation['translation']>(
  english['translation']
);
