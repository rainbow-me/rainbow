import { getGlobal, saveGlobal } from './common';
import { NonceManager } from '@/entities';

export const NONCE_MANAGER = 'nonceManager';
const noncesVersion = '0.0.2';

export const getNonceManager = async (): Promise<NonceManager> => {
  const nonceManager = await getGlobal(NONCE_MANAGER, {}, noncesVersion);

  return nonceManager;
};

export const saveNonceManager = (nonceManager: NonceManager) => saveGlobal(NONCE_MANAGER, nonceManager, noncesVersion);
