import { nanoid } from 'nanoid/non-secure';
import { SECURE_WALLET_HASH_KEY } from 'react-native-dotenv';
import type { Address } from 'viem';

import * as ls from '@/storage';
import * as keychain from '@/model/keychain';
import { analyticsUserIdentifier } from '@/utils/keychainConstants';
import { logger, RainbowError } from '@/logger';
import { computeHmac, SupportedAlgorithm } from '@ethersproject/sha2';
import { findWalletWithAccount } from '@/helpers/findWalletWithAccount';
import store from '@/redux/store';
import { EthereumWalletType } from '@/helpers/walletTypes';

/**
 * Returns the device id in a type-safe manner. It will throw if no device ID
 * is available in local storage. It should only be used AFTER
 * `getOrCreateDeviceId` has been called by the application init process.
 */
export function getDeviceId(): string {
  const id = ls.device.get(['id']);

  if (!id) {
    throw new Error(
      `getDeviceId() was called, but no device ID was available on local storage. Have you called getOrCreateDeviceId() yet?`
    );
  }

  return id;
}

/**
 * ONLY used during application startup. Please otherwise use local storage
 * `device.get(['id'])` to retrieve this value. For type-safe access, please
 * use `getDeviceId` from this same file.
 *
 * Returns a tuple `[deviceId, wasCreated]`.
 */
export async function getOrCreateDeviceId(): Promise<[string, boolean]> {
  const deviceIdFromStorage = ls.device.get(['id']);

  if (deviceIdFromStorage) {
    logger.debug(`[getOrCreateDeviceId]: using existing deviceId from storage ${deviceIdFromStorage}`);
    // if we have a ID in storage, we've already migrated
    return [deviceIdFromStorage, false];
  } else {
    // load old ID if exists
    const deviceIdFromKeychain = await keychain.loadString(analyticsUserIdentifier);
    const hasExistingDeviceId = typeof deviceIdFromKeychain === 'string';
    // prefer old ID, otherwise create a new one
    const deviceId = hasExistingDeviceId ? deviceIdFromKeychain : nanoid();
    // set ID
    ls.device.set(['id'], deviceId);

    if (hasExistingDeviceId) {
      logger.debug(`[getOrCreateDeviceId]: migrating device ID from keychain to local storage`);
    }

    logger.debug(`[getOrCreateDeviceId]: returned new deviceId ${deviceId}`);

    // if we had an old device id in keychain, `wasCreated` should be false
    return [deviceId, !hasExistingDeviceId];
  }
}

function securelyHashWalletAddress(walletAddress: Address): string | undefined {
  if (!SECURE_WALLET_HASH_KEY) {
    logger.error(new RainbowError(`[securelyHashWalletAddress]: Required .env variable SECURE_WALLET_HASH_KEY does not exist`));
  }

  try {
    const hmac = computeHmac(
      SupportedAlgorithm.sha256,
      // must be hex `0x<key>` string
      SECURE_WALLET_HASH_KEY,
      // must be hex `0x<key>` string
      walletAddress
    );

    logger.debug(`[securelyHashWalletAddress]: Wallet address securely hashed`);

    return hmac;
  } catch (e) {
    // could be an invalid hashing key, or trying to hash an ENS
    logger.error(new RainbowError(`[securelyHashWalletAddress]: Wallet address hashing failed`));
  }
}

export type WalletContext = {
  walletType?: 'owned' | 'hardware' | 'watched';
  walletAddressHash?: string;
};

export async function getWalletContext(address: Address): Promise<WalletContext> {
  // currentAddressStore address is initialized to ''
  if (!address || address === ('' as Address)) return {};

  // walletType maybe undefined after initial wallet creation
  const { wallets } = store.getState();
  const wallet = findWalletWithAccount(wallets.wallets || {}, address);

  const walletType = (
    {
      [EthereumWalletType.mnemonic]: 'owned',
      [EthereumWalletType.privateKey]: 'owned',
      [EthereumWalletType.seed]: 'owned',
      [EthereumWalletType.readOnly]: 'watched',
      [EthereumWalletType.bluetooth]: 'hardware',
    } as const
  )[wallet?.type!];
  const walletAddressHash = securelyHashWalletAddress(address);

  return {
    walletType,
    walletAddressHash,
  };
}
