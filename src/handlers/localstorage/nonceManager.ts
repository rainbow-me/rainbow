import { getGlobal, saveGlobal } from './common';

export const NONCE_MANAGER = 'nonceManager';

type NetworkId = string;
interface NetworkNonceInfo {
  nonce: string;
}
type AccountNonceInfo = Record<NetworkId, NetworkNonceInfo>;

export const getNonceManager = async () => {
  const nonceManager = await getGlobal(NONCE_MANAGER, []);

  return nonceManager;
};

export const saveNonceManager = (nonceManager: AccountNonceInfo) =>
  saveGlobal(NONCE_MANAGER, nonceManager);
