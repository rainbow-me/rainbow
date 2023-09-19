import lang from 'i18n-js';
import en_US from './en_US.json';
import es_419 from './es_419.json';
import fr_FR from './fr_FR.json';
import ja_JP from './ja_JP.json';
import pt_BR from './pt_BR.json';
import zh_CN from './zh_CN.json';
import id_ID from './id_ID.json';
import hi_IN from './hi_IN.json';
import tr_TR from './tr_TR.json';
import ru_RU from './ru_RU.json';

import { simpleObjectProxy } from '@/languages/utils';
import { enUS, eo, ru, fr } from 'date-fns/locale';

/**
 * Use English as our "template" for translations. All other translations
 * should match the objects and keys within the English translation.
 */
export type Translation = typeof en_US;

export enum Language {
  EN_US = 'en_US',
  ES_419 = 'es_419',
  FR_FR = 'fr_FR',
  JA_JP = 'ja_JP',
  PT_BR = 'pt_BR',
  ZH_CN = 'zh_CN',
  ID_ID = 'id_ID',
  HI_IN = 'hi_IN',
  TR_TR = 'tr_TR',
  RU_RU = 'ru_RU',
}

export const resources: {
  [key in Language]: any;
} = {
  en_US,
  es_419,
  fr_FR,
  ja_JP,
  pt_BR,
  zh_CN,
  id_ID,
  hi_IN,
  tr_TR,
  ru_RU,
};

export const supportedLanguages = {
  [Language.EN_US]: {
    label: 'English',
  },
  [Language.ES_419]: {
    label: 'Español',
  },
  [Language.FR_FR]: {
    label: 'Français',
  },
  [Language.JA_JP]: {
    label: '日本語',
  },
  [Language.PT_BR]: {
    label: 'Português',
  },
  [Language.ZH_CN]: {
    label: '中文',
  },
  [Language.ID_ID]: {
    label: 'Bahasa Indonesia',
  },
  [Language.HI_IN]: {
    label: 'हिंदी',
  },
  [Language.TR_TR]: {
    label: 'Türkçe',
  },
  [Language.RU_RU]: {
    label: 'Русский',
  },
};

export function getDateFnsLocale() {
  switch (lang.locale) {
    case Language.FR_FR:
      return fr;
    default:
      return enUS;
  }
}

// Configure languages
lang.defaultLocale = Language.EN_US;
lang.locale = Language.EN_US;
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
  en_US['translation']
);
