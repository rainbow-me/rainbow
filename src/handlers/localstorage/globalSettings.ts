import { getGlobal, saveGlobal } from './common';

export const IMAGE_METADATA = 'imageMetadata';
const KEYBOARD_HEIGHT = 'keyboardHeight';
const AUTH_TIMELOCK = 'authTimelock';
const PIN_AUTH_ATTEMPTS_LEFT = 'pinAuthAttemptsLeft';

export const getAuthTimelock = () => getGlobal(AUTH_TIMELOCK, null);

export const saveAuthTimelock = (ts: any) => saveGlobal(AUTH_TIMELOCK, ts);

export const getPinAuthAttemptsLeft = () => getGlobal(PIN_AUTH_ATTEMPTS_LEFT, null);

export const savePinAuthAttemptsLeft = (amount: any) => saveGlobal(PIN_AUTH_ATTEMPTS_LEFT, amount);

export const getKeyboardHeight = () => getGlobal(KEYBOARD_HEIGHT, null);

export const setKeyboardHeight = (height: any) => saveGlobal(KEYBOARD_HEIGHT, height);

export const getImageMetadata = () => getGlobal(IMAGE_METADATA, {});

export const saveImageMetadata = (imageMetadata: any) => saveGlobal(IMAGE_METADATA, imageMetadata);
