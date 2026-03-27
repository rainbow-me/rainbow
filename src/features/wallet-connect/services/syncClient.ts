import type { IWalletKit } from '@reown/walletkit';

let syncWalletKitClient: IWalletKit | undefined;

export function setSyncWalletKitClient(client: IWalletKit) {
  syncWalletKitClient = client;
}

/**
 * Synchronous version of `getAllActiveSessions`. Returns all active sessions
 * in a type-safe manner.
 */
export function getAllActiveSessionsSync() {
  return Object.values(syncWalletKitClient?.getActiveSessions() || {}) || [];
}
