import { getGlobal, saveGlobal } from './common';

export const NONCE_MANAGER = 'nonceManager';

interface NetworkNonceInfo {
  nonce: number;
}
interface AccountNonceInfo {
  [key: string]: NetworkNonceInfo;
}

export interface NonceManager {
  [key: string]: AccountNonceInfo;
}

export interface NonceManagerUpdate {
  network: string;
  account: string;
  nonce: number;
}

// -- Constants --------------------------------------- //
export const NONCE_MANAGER_LOAD_SUCCESS = 'NONCE_MANAGER_LOAD_SUCCESS';
export const NONCE_MANAGER_LOAD_FAILURE = 'NONCE_MANAGER_LOAD_FAILURE';
export const NONCE_MANAGER_UPDATE_NONCE = 'NONCE_MANAGER_UPDATE_NONCE';

export const getNonceManager = async (): Promise<NonceManager> => {
  const nonceManager = await getGlobal(NONCE_MANAGER, []);

  return nonceManager;
};

export const saveNonceManager = (nonceManager: NonceManager) =>
  saveGlobal(NONCE_MANAGER, nonceManager);
