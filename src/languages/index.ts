import lang from 'i18n-js';
import ar_AR from './ar_AR.json';
import en_US from './en_US.json';
import es_419 from './es_419.json';
import fr_FR from './fr_FR.json';
import hi_IN from './hi_IN.json';
import id_ID from './id_ID.json';
import ja_JP from './ja_JP.json';
import ko_KR from './ko_KR.json';
import pt_BR from './pt_BR.json';
import ru_RU from './ru_RU.json';
import th_TH from './th_TH.json';
import tr_TR from './tr_TR.json';
import zh_CN from './zh_CN.json';

import { simpleObjectProxy } from '@/languages/utils';
import { enUS, es, fr, hi, id, ja, ptBR, ru, tr, zhCN, ar, th, ko } from 'date-fns/locale';

/**
 * Use English as our "template" for translations. All other translations
 * should match the objects and keys within the English translation.
 */
export type Translation = typeof en_US;

export enum Language {
  AR_AR = 'ar_AR',
  EN_US = 'en_US',
  ES_419 = 'es_419',
  FR_FR = 'fr_FR',
  HI_IN = 'hi_IN',
  ID_ID = 'id_ID',
  JA_JP = 'ja_JP',
  KO_KR = 'ko_KR',
  PT_BR = 'pt_BR',
  RU_RU = 'ru_RU',
  TH_TH = 'th_TH',
  TR_TR = 'tr_TR',
  ZH_CN = 'zh_CN',
}

export const resources: {
  [key in Language]: any;
} = {
  ar_AR,
  en_US,
  es_419,
  fr_FR,
  hi_IN,
  id_ID,
  ja_JP,
  ko_KR,
  pt_BR,
  ru_RU,
  th_TH,
  tr_TR,
  zh_CN,
};

export const supportedLanguages = {
  [Language.EN_US]: {
    label: 'English',
  },
  [Language.ZH_CN]: {
    label: '中文',
  },
  [Language.HI_IN]: {
    label: 'हिंदी',
  },
  [Language.ES_419]: {
    label: 'Español',
  },
  [Language.FR_FR]: {
    label: 'Français',
  },
  [Language.AR_AR]: {
    label: 'العربية',
  },
  [Language.PT_BR]: {
    label: 'Português brasileiro',
  },
  [Language.RU_RU]: {
    label: 'Русский',
  },
  [Language.ID_ID]: {
    label: 'Bahasa Indonesia',
  },
  [Language.JA_JP]: {
    label: '日本語',
  },
  [Language.TR_TR]: {
    label: 'Türkçe',
  },
  [Language.KO_KR]: {
    label: '한국어',
  },
  [Language.TH_TH]: {
    label: 'ภาษาไทย',
  },
};

export function getDateFnsLocale() {
  switch (lang.locale) {
    case Language.AR_AR:
      return ar;
    case Language.EN_US:
      return enUS;
    case Language.ES_419:
      return es;
    case Language.FR_FR:
      return fr;
    case Language.HI_IN:
      return hi;
    case Language.ID_ID:
      return id;
    case Language.JA_JP:
      return ja;
    case Language.KO_KR:
      return ko;
    case Language.PT_BR:
      return ptBR;
    case Language.RU_RU:
      return ru;
    case Language.TH_TH:
      return th;
    case Language.TR_TR:
      return tr;
    case Language.ZH_CN:
      return zhCN;
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
export const l = simpleObjectProxy<Translation['translation']>(en_US['translation']);
