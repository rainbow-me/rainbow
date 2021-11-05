import { getGlobal, saveGlobal } from './common';

export const NONCE_MANAGER = 'nonceManager';

type NetworkId = string;
type AccountId = string;
interface NetworkNonceInfo {
  nonce: string;
}
interface AccountNonceInfo {
  [key: NetworkId]: NetworkNonceInfo;
}
interface NonceManager {
  [key: AccountId]: AccountNonceInfo;
}

export const getNonceManager = async (): Promise<NonceManager> => {
  const nonceManager = await getGlobal(NONCE_MANAGER, []);

  return nonceManager;
};

export const saveNonceManager = (nonceManager: NonceManager) =>
  saveGlobal(NONCE_MANAGER, nonceManager);
