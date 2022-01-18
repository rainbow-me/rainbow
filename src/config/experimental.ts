/**
 * This file contains flags for enabling features which are still in development.
 * While adding new functionality, please verify it against these features
 * keeping in mind that they should never be broken
 */

export const AVATAR_PICKER = 'avatarPicker';
export const LANGUAGE_SETTINGS = 'languageSettings';
export const REVIEW_ANDROID = 'reviewAndroid';
export const ANDROID_SHADOWS_V2 = 'androidShadowsV2';

export const defaultConfig = {
  [ANDROID_SHADOWS_V2]: false,
  [AVATAR_PICKER]: ios,
  [LANGUAGE_SETTINGS]: false,
  [REVIEW_ANDROID]: false,
};
