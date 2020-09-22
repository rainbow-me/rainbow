/**
 * This file contains flags for enabling features which are still in development.
 * While adding new functionality, please verify it against these features
 * keeping in mind that they should never be broken
 */

// this flag is used outside components and cannot be changed dynamically
export const chartExpandedAvailable = true;

export const AVATAR_PICKER = 'avatarPicker';
export const DISCOVER_SHEET = 'discoverSheet';
export const NEW_ONBOARDING = 'newOnboardingFlow';

export const defaultConfig = {
  [AVATAR_PICKER]: false,
  [DISCOVER_SHEET]: false,
  [NEW_ONBOARDING]: false,
};
