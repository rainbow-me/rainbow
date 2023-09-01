import { I18n } from 'i18n-js';

import en_US from './en_US.json';
import fr_FR from './fr_FR.json';
import ja_JP from './ja_JP.json';

import { simpleObjectProxy } from '@/languages/utils';

/**
 * Use English (EN_US) as our "template" for translations. All other translations
 * should match the objects and keys within the English translation.
 */
export type Translation = typeof en_US;

export enum Language {
  EN_US = 'en_US',
  FR_FR = 'fr_FR',
  JA_JP = 'ja_JP',
}

export const lang = new I18n({
  en_US,
  fr_FR,
  ja_JP,
});

// Configure languages
lang.defaultLocale = Language.EN_US;
lang.locale = Language.EN_US;
lang.enableFallback = true;

export const supportedLanguages = {
  [Language.EN_US]: {
    label: 'English',
  },
  [Language.FR_FR]: {
    label: 'Français',
  },
  [Language.JA_JP]: {
    label: '日本語',
  },
};

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
  en_US['translation']
);
