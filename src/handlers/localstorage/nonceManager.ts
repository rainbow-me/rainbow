import { getGlobal, saveGlobal } from './common';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/entities' or its c... Remove this comment to see the full error message
import { NonceManager } from '@rainbow-me/entities';

export const NONCE_MANAGER = 'nonceManager';

export const getNonceManager = async (): Promise<NonceManager> => {
  const nonceManager = await getGlobal(NONCE_MANAGER, {});

  return nonceManager;
};

export const saveNonceManager = (nonceManager: NonceManager) =>
  saveGlobal(NONCE_MANAGER, nonceManager);
