import networkTypes from '../../helpers/networkTypes';
import { getGlobal, saveGlobal } from './common';

const IMAGE_METADATA = 'imageMetadata';
const KEYBOARD_HEIGHT = 'keyboardHeight';
const LANGUAGE = 'language';
const NATIVE_CURRENCY = 'nativeCurrency';
const NETWORK = 'network';
const KEYCHAIN_INTEGRITY_STATE = 'keychainIntegrityState';
const AUTH_TIMELOCK = 'authTimelock';
const PIN_AUTH_ATTEMPTS_LEFT = 'pinAuthAttemptsLeft';

export const getKeychainIntegrityState = () =>
  getGlobal(KEYCHAIN_INTEGRITY_STATE, null);

export const saveKeychainIntegrityState = state =>
  saveGlobal(KEYCHAIN_INTEGRITY_STATE, state);

export const getAuthTimelock = () => getGlobal(AUTH_TIMELOCK, null);

export const saveAuthTimelock = ts => saveGlobal(AUTH_TIMELOCK, ts);
export const getPinAuthAttemptsLeft = () =>
  getGlobal(PIN_AUTH_ATTEMPTS_LEFT, null);

export const savePinAuthAttemptsLeft = amount =>
  saveGlobal(PIN_AUTH_ATTEMPTS_LEFT, amount);

export const getLanguage = () => getGlobal(LANGUAGE, 'en');

export const saveLanguage = language => saveGlobal(LANGUAGE, language);

export const getNetwork = () => getGlobal(NETWORK, networkTypes.mainnet);

export const saveNetwork = network => saveGlobal(NETWORK, network);

export const getKeyboardHeight = () => getGlobal(KEYBOARD_HEIGHT, null);

export const setKeyboardHeight = height => saveGlobal(KEYBOARD_HEIGHT, height);

export const getNativeCurrency = () => getGlobal(NATIVE_CURRENCY, 'USD');

export const saveNativeCurrency = nativeCurrency =>
  saveGlobal(NATIVE_CURRENCY, nativeCurrency);

export const getImageMetadata = () => getGlobal(IMAGE_METADATA, {});

export const saveImageMetadata = imageMetadata =>
  saveGlobal(IMAGE_METADATA, imageMetadata);
