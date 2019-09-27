import {
  getLocal,
  saveLocal,
} from './common';

/**
 * @desc get native currency
 * @return {Object}
 */
export const getNativeCurrency = async () => {
  const nativeCurrency = await getLocal('nativeCurrency');
  const currency = nativeCurrency ? nativeCurrency.data : 'USD';
  if (currency === 'GBP') {
    await saveNativeCurrency('USD');
    return 'USD';
  }
  return currency;
};

/**
 * @desc save native currency
 * @param  {String}   [currency]
 */
export const saveNativeCurrency = async nativeCurrency => {
  await saveLocal(
    'nativeCurrency',
    { data: nativeCurrency },
  );
};

/**
 * @desc get language
 * @return {Object}
 */
export const getLanguage = async () => {
  const language = await getLocal('language');
  return language ? language.data : 'en';
};

/**
 * @desc save language
 * @param  {String}   [language]
 */
export const saveLanguage = async language => {
  await saveLocal('language', { data: language });
};

/**
 * @desc get show shitcoins setting
 * @return {True|False}
 */
export const getShowShitcoinsSetting = async () => {
  const showShitcoins = await getLocal('showShitcoins');
  return showShitcoins ? showShitcoins.data : null;
};

/**
 * @desc update show shitcoins setting
 * @param  {Boolean}   [updatedSetting]
 * @return {Void}
 */
export const updateShowShitcoinsSetting = async (updatedSetting) => {
  await saveLocal('showShitcoins', { data: updatedSetting });
};

// apple restricts number of times developers are allowed to throw
// the in-app AppStore Review interface.
// see here for more: https://github.com/oblador/react-native-store-review
export const getAppStoreReviewRequestCount = async () => {
  const count = await getLocal('appStoreReviewRequestCount');
  return count ? count.data : 0;
};

export const setAppStoreReviewRequestCount = async (newCount) => {
  await saveLocal('appStoreReviewRequestCount', { data: newCount });
};
