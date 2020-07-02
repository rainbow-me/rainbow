/**
 * This file contains flags for enabling features which are still in development.
 * While adding new functionality, please verify it against these features
 * keeping in mind that they should never be broken
 */

// this flag is used outside components and cannot be changed dynamically
export const chartExpandedAvailable = false;

export const AVATAR_PICKER = 'avatarPicker';
export const DISCOVER_SHEET = 'discoverSheet';
export const NATIVE_BPA = 'nativeButtonPressAnimation';
export const NATIVE_TRANSACTION_LIST = 'nativeTransactionList';
export const NEW_ONBOARDING = 'newOnboardingFlow';
export const RAINBOW_TEXT = 'rainbowText';
export const NEW_SPLASH_SCREEN = 'newSplashScreen';

export const defaultConfig = {
  [AVATAR_PICKER]: false,
  [DISCOVER_SHEET]: false,
  [NATIVE_BPA]: true,
  [NATIVE_TRANSACTION_LIST]: true,
  [NEW_ONBOARDING]: false,
  [NEW_SPLASH_SCREEN]: true,
  [RAINBOW_TEXT]: true,
};
