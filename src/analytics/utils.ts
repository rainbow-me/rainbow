import { nanoid } from 'nanoid/non-secure';
import { ethers } from 'ethers';
import { SECURE_WALLET_HASH_KEY } from 'react-native-dotenv';

import * as ls from '@/storage';
import * as keychain from '@/model/keychain';
import { analyticsUserIdentifier } from '@/utils/keychainConstants';
import { logger, RainbowError } from '@/logger';

/**
 * Returns our custom device ID from local storage. If one isn't set, it
 * generates a new ID, stores it, and returns it.
 */
export async function getDeviceId(): Promise<string> {
  const deviceIdFromStorage = ls.device.get(['id']);

  if (deviceIdFromStorage) {
    logger.debug(`Using existing deviceId from storage`);
    // if we have a ID in storage, we've already migrated
    return deviceIdFromStorage;
  } else {
    // load old ID if exists
    const deviceIdFromKeychain = await keychain.loadString(
      analyticsUserIdentifier
    );
    const hasExistingDeviceId = typeof deviceIdFromKeychain === 'string';
    // prefer old ID, otherwise create a new one
    const deviceId = hasExistingDeviceId ? deviceIdFromKeychain : nanoid();
    // set ID
    ls.device.set(['id'], deviceId);

    // log to Sentry
    if (hasExistingDeviceId) {
      logger.info(`Migrating device ID from keychain to local storage`);
    }

    logger.debug(`Created new deviceId`);

    return deviceId;
  }
}

export function securelyHashWalletAddress(
  walletAddress: string
): string | undefined {
  if (!SECURE_WALLET_HASH_KEY) {
    logger.error(
      new RainbowError(
        `Required .env variable SECURE_WALLET_HASH_KEY does not exist`
      )
    );
  }

  try {
    const hmac = ethers.utils.computeHmac(
      ethers.utils.SupportedAlgorithm.sha256,
      // must be hex `0x<key>` string
      SECURE_WALLET_HASH_KEY,
      // must be hex `0x<key>` string
      walletAddress
    );

    logger.debug(`Wallet address securely hashed`);

    return hmac;
  } catch (e) {
    // could be an invalid hashing key, or trying to hash an ENS
    logger.error(new RainbowError(`Wallet address hashing failed`));
  }
}
