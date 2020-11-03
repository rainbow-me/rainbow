import { Platform } from 'react-native';
/**
 * This file contains flags for enabling features which are still in development.
 * While adding new functionality, please verify it against these features
 * keeping in mind that they should never be broken
 */

export const AVATAR_PICKER = 'avatarPicker';
export const DISCOVER_SHEET = 'discoverSheet';

export const defaultConfig = {
  [AVATAR_PICKER]: Platform.OS === 'ios',
  [DISCOVER_SHEET]: false,
};
