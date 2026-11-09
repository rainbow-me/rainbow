import { NativeCurrencyKeys } from '@/features/currency/types';
import { ChainId } from '@/features/network/types/backendNetworks';

import { getGlobal, saveGlobal } from './common';

export const IMAGE_METADATA = 'imageMetadata';
const KEYBOARD_HEIGHT = 'keyboardHeight';
const NATIVE_CURRENCY = 'nativeCurrency';
const CHAIN_ID = 'chainId';
const AUTH_TIMELOCK = 'authTimelock';
const PIN_AUTH_ATTEMPTS_LEFT = 'pinAuthAttemptsLeft';
const TESTNETS_ENABLED = 'testnetsEnabled';

export const getAuthTimelock = () => getGlobal(AUTH_TIMELOCK, null);

export const saveAuthTimelock = (ts: any) => saveGlobal(AUTH_TIMELOCK, ts);

export const getPinAuthAttemptsLeft = () => getGlobal(PIN_AUTH_ATTEMPTS_LEFT, null);

export const savePinAuthAttemptsLeft = (amount: any) => saveGlobal(PIN_AUTH_ATTEMPTS_LEFT, amount);

export const getChainId = () => getGlobal(CHAIN_ID, ChainId.mainnet);

export const saveChainId = (chainId: ChainId) => saveGlobal(CHAIN_ID, chainId);

export const getKeyboardHeight = () => getGlobal(KEYBOARD_HEIGHT, null);

export const setKeyboardHeight = (height: any) => saveGlobal(KEYBOARD_HEIGHT, height);

export const getNativeCurrency = () => getGlobal(NATIVE_CURRENCY, NativeCurrencyKeys.USD);

export const getImageMetadata = () => getGlobal(IMAGE_METADATA, {});

export const saveImageMetadata = (imageMetadata: any) => saveGlobal(IMAGE_METADATA, imageMetadata);

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
