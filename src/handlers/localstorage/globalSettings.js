import { getGlobal, saveGlobal } from './common';

const APPSTORE_REVIEW_COUNT = 'appStoreReviewRequestCount';
const KEYBOARD_HEIGHT = 'keyboardHeight';
const LANGUAGE = 'language';
const NATIVE_CURRENCY = 'nativeCurrency';

export const getAppStoreReviewCount = () => getGlobal(APPSTORE_REVIEW_COUNT, 0);

export const saveAppStoreReviewCount = reviewCount =>
  saveGlobal(APPSTORE_REVIEW_COUNT, reviewCount);

export const getLanguage = () => getGlobal(LANGUAGE, 'en');

export const saveLanguage = language => saveGlobal(LANGUAGE, language);

export const getKeyboardHeight = () => getGlobal(KEYBOARD_HEIGHT, null);

export const setKeyboardHeight = height => saveGlobal(KEYBOARD_HEIGHT, height);

export const getNativeCurrency = () => getGlobal(NATIVE_CURRENCY, 'USD');

export const saveNativeCurrency = nativeCurrency =>
  saveGlobal(NATIVE_CURRENCY, nativeCurrency);
