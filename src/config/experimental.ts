/**
 * This file contains flags for enabling features which are still in development.
 * While adding new functionality, please verify it against these features
 * keeping in mind that they should never be broken
 */

export const LANGUAGE_SETTINGS = 'languageSettings';
export const REVIEW_ANDROID = 'reviewAndroid';
export const PROFILES = 'ENS Profiles';
export const FLASHBOTS = 'Flashbots';

export const defaultConfig = {
  [FLASHBOTS]: { settings: true, value: false },
  [LANGUAGE_SETTINGS]: { settings: false, value: false },
  [PROFILES]: { settings: true, value: false },
  [REVIEW_ANDROID]: { settings: false, value: false },
};
