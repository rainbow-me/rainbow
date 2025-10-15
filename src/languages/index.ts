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

import { enUS, es, fr, hi, id, ja, ptBR, ru, tr, zhCN, ar, th, ko } from 'date-fns/locale';

// ============ Internal Language Manager ====================================== //

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

// Initialize locale from persisted storage synchronously
// This runs at module load time to ensure i18n is set before first render
// Using dynamic import to avoid circular dependencies
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { rainbowStorage } = require('@/state/internal/rainbowStorage');
  const persistedSettings = rainbowStorage.getString('settings:settings');
  if (persistedSettings) {
    const settings = JSON.parse(persistedSettings);
    const storedLanguage = settings?.state?.language;
    if (storedLanguage && storedLanguage !== Language.EN_US) {
      lang.locale = storedLanguage;
    }
  }
} catch (error) {
  // If storage isn't available yet, just use default
}

export const updateLanguageLocale = (code: Language) => {
  lang.locale = code;
};

// ============ Proxy Types ========================================================== //

type TranslationParams = Record<string, string | number>;

type TranslationLeaf = ((params?: TranslationParams) => string) & {
  toString(): string;
  __keypath__?: string;
};

type LanguageProxy<T> = T extends string ? TranslationLeaf : { [K in keyof T]: LanguageProxy<T[K]> };

// ============ Proxy Utilities ====================================================== //

/**
 * A simple helper that finds a nested value in an object
 * by drilling down the path array.
 */
export function getValueAtPath(obj: unknown, path: string[]): unknown {
  let current: any = obj;
  for (const key of path) {
    if (!current || typeof current !== 'object') {
      return undefined;
    }
    current = current[key];
  }
  return current;
}

// ============ Proxy Creation ================================================= //

/**
 * Creates a runtime Proxy that dynamically resolves:
 *  - Leaf nodes to a callable string function
 *  - Nested objects to sub-proxies
 */
function createLangProxy(keypath: string[] = []): any {
  return new Proxy(
    {},
    {
      get(_target, prop: string | symbol) {
        if (typeof prop === 'symbol') return undefined;
        // Build up the keypath
        const nextPath = [...keypath, prop];
        const pathString = nextPath.join('.');

        // Attempt to see if we've got a leaf in en_US
        const value = getValueAtPath(en_US.translation, nextPath);

        if (typeof value === 'string') {
          // Return a "callable string" function
          const fn = ((params?: TranslationParams) => lang.t(pathString, params)) as TranslationLeaf;
          fn.toString = () => lang.t(pathString);
          fn.__keypath__ = pathString;
          return fn;
        }
        // Otherwise return another nested proxy
        return createLangProxy(nextPath);
      },
    }
  );
}

// ============ i18n Proxy ===================================================== //

/**
 * Callable i18n proxy
 *
 * Type-safe usage:
 *   `i18n.account.hide()`
 *   `i18n.account.hide({ accountName: 'myAccount' })`
 *   `i18n.account.hide.toString()`
 */
const i18n: LanguageProxy<Translation['translation']> = createLangProxy();

export default i18n;
