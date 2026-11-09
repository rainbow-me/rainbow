// The `import/no-duplicates` rule false-positives here because all locale subpaths resolve
// to the same `date-fns/typings.d.ts` declaration file, making ESLint think they are
// duplicate imports from one module — they are not.
/* eslint-disable import/no-duplicates */
import ar from 'date-fns/locale/ar-SA';
import enUS from 'date-fns/locale/en-US';
import es from 'date-fns/locale/es';
import fr from 'date-fns/locale/fr';
import hi from 'date-fns/locale/hi';
import id from 'date-fns/locale/id';
import ja from 'date-fns/locale/ja';
import ko from 'date-fns/locale/ko';
import ptBR from 'date-fns/locale/pt-BR';
import ru from 'date-fns/locale/ru';
import th from 'date-fns/locale/th';
import tr from 'date-fns/locale/tr';
import zhCN from 'date-fns/locale/zh-CN';
import lang from 'i18n-js';

import { appSettingsActions } from '@/features/settings/data/appSettingsStore';
import { Language } from '@/languages/types';
import { simpleObjectProxy } from '@/languages/utils';

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

/* eslint-enable import/no-duplicates */

/**
 * Use English as our "template" for translations. All other translations
 * should match the objects and keys within the English translation.
 */
export type Translation = typeof en_US;

/** Supported languages in their settings-menu order. */
export const supportedLanguages = [
  { code: Language.EN_US, label: 'English' },
  { code: Language.ZH_CN, label: '中文' },
  { code: Language.HI_IN, label: 'हिंदी' },
  { code: Language.ES_419, label: 'Español' },
  { code: Language.FR_FR, label: 'Français' },
  { code: Language.AR_AR, label: 'العربية' },
  { code: Language.PT_BR, label: 'Português brasileiro' },
  { code: Language.RU_RU, label: 'Русский' },
  { code: Language.ID_ID, label: 'Bahasa Indonesia' },
  { code: Language.JA_JP, label: '日本語' },
  { code: Language.TR_TR, label: 'Türkçe' },
  { code: Language.KO_KR, label: '한국어' },
  { code: Language.TH_TH, label: 'ภาษาไทย' },
];

/**
 * Returns the date-fns locale for the current app language.
 */
export function getDateFnsLocale() {
  switch (appSettingsActions.getLanguage()) {
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
lang.fallbacks = true;
lang.translations = {
  ar_AR: ar_AR.translation,
  en_US: en_US.translation,
  es_419: es_419.translation,
  fr_FR: fr_FR.translation,
  hi_IN: hi_IN.translation,
  id_ID: id_ID.translation,
  ja_JP: ja_JP.translation,
  ko_KR: ko_KR.translation,
  pt_BR: pt_BR.translation,
  ru_RU: ru_RU.translation,
  th_TH: th_TH.translation,
  tr_TR: tr_TR.translation,
  zh_CN: zh_CN.translation,
};

/**
 * Translates a keypath in the current app language, with optional interpolation
 * values or an explicit locale.
 *   `import * as i18n from '@/languages'`
 *
 * Type-safe usage:
 *   `i18n.t(i18n.l.account.hide, { accountName: 'myAccount' })`
 *
 * Alternative standard usage:
 *   `i18n.t('account.hide', { accountName: 'myAccount' })`
 */
export function t(keypath: string | { __keypath__: string }, args?: { [key: string]: string | number }) {
  return lang.t(typeof keypath === 'string' ? keypath : keypath.__keypath__, {
    locale: appSettingsActions.getLanguage(),
    ...args,
  });
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
