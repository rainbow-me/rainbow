import { ChainId } from '@/state/backendNetworks/types';
import { getGlobal, saveGlobal } from './common';
import { NativeCurrencyKeys } from '@/entities';
import { Language } from '@/languages';

export const IMAGE_METADATA = 'imageMetadata';
const KEYBOARD_HEIGHT = 'keyboardHeight';
const APP_ICON = 'appIcon';
const LANGUAGE = 'language';
const NATIVE_CURRENCY = 'nativeCurrency';
const CHAIN_ID = 'chainId';
const KEYCHAIN_INTEGRITY_STATE = 'keychainIntegrityState';
const AUTH_TIMELOCK = 'authTimelock';
const PIN_AUTH_ATTEMPTS_LEFT = 'pinAuthAttemptsLeft';
const TRANSACTION_SIGNATURES = 'transactionSignatures';
const TESTNETS_ENABLED = 'testnetsEnabled';

export const getKeychainIntegrityState = () => getGlobal(KEYCHAIN_INTEGRITY_STATE, null);

export const saveKeychainIntegrityState = (state: any) => saveGlobal(KEYCHAIN_INTEGRITY_STATE, state);

export const getAuthTimelock = () => getGlobal(AUTH_TIMELOCK, null);

export const saveAuthTimelock = (ts: any) => saveGlobal(AUTH_TIMELOCK, ts);

export const getPinAuthAttemptsLeft = () => getGlobal(PIN_AUTH_ATTEMPTS_LEFT, null);

export const savePinAuthAttemptsLeft = (amount: any) => saveGlobal(PIN_AUTH_ATTEMPTS_LEFT, amount);

export const getLanguage = () => getGlobal(LANGUAGE, Language.EN_US);

export const saveLanguage = (language: any) => saveGlobal(LANGUAGE, language);

export const getChainId = () => getGlobal(CHAIN_ID, ChainId.mainnet);

export const saveChainId = (chainId: ChainId) => saveGlobal(CHAIN_ID, chainId);

export const getKeyboardHeight = () => getGlobal(KEYBOARD_HEIGHT, null);

export const setKeyboardHeight = (height: any) => saveGlobal(KEYBOARD_HEIGHT, height);

export const getNativeCurrency = () => getGlobal(NATIVE_CURRENCY, NativeCurrencyKeys.USD);

export const getAppIcon = () => getGlobal(APP_ICON, 'og');

export const saveNativeCurrency = (nativeCurrency: any) => saveGlobal(NATIVE_CURRENCY, nativeCurrency);

export const getImageMetadata = () => getGlobal(IMAGE_METADATA, {});

export const saveImageMetadata = (imageMetadata: any) => saveGlobal(IMAGE_METADATA, imageMetadata);

/**
 * @desc save transaction signatures
 * @param  {Object}   [transactionSignatures]
 */
export const saveTransactionSignatures = (transactionSignatures: any) => saveGlobal(TRANSACTION_SIGNATURES, transactionSignatures);

/**
 * @desc get transaction signatures
 */
export const getTransactionSignatures = () => getGlobal(TRANSACTION_SIGNATURES, {});

/**
 * @desc get testnets enabled preference
 */
export const getTestnetsEnabled = () => getGlobal(TESTNETS_ENABLED, false);

/**
 * @desc save testnets enabled preference
 * @param  {Boolean}  [value]
 */
export const saveTestnetsEnabled = (preference: boolean) => {
  saveGlobal(TESTNETS_ENABLED, preference);
};

/**
 * @desc save app icon  preference
 * @param  {string}  [value]
 */
export const saveAppIcon = (appIcon: string) => {
  saveGlobal(APP_ICON, appIcon);
};
