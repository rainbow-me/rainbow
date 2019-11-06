import { getGlobal, saveGlobal } from './common';

const APPSTORE_REVIEW_COUNT = 'appStoreReviewRequestCount';
const LANGUAGE = 'language';
const NATIVE_CURRENCY = 'nativeCurrency';

export const getAppStoreReviewCount = () => getGlobal(APPSTORE_REVIEW_COUNT, 0);

export const saveAppStoreReviewCount = reviewCount =>
  saveGlobal(APPSTORE_REVIEW_COUNT, reviewCount);

export const getLanguage = () => getGlobal(LANGUAGE, 'en');

export const saveLanguage = language => saveGlobal(LANGUAGE, language);

export const getNativeCurrency = () => getGlobal(NATIVE_CURRENCY, 'USD');

export const saveNativeCurrency = nativeCurrency =>
  saveGlobal(NATIVE_CURRENCY, nativeCurrency);
