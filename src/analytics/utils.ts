import { nanoid } from 'nanoid/non-secure';
import { ethers } from 'ethers';
// TODO
import { ANALYTICS_KEY } from 'react-native-dotenv';

import * as ls from '@/storage';
import * as keychain from '@/model/keychain';
import { analyticsUserIdentifier } from '@/utils/keychainConstants';
import { logger } from '@/logger';

/**
 * Returns our custom device ID from local storage. If one isn't set, it
 * generates a new ID, stores it, and returns it.
 */
export async function getDeviceId(): Promise<string> {
  const deviceIdFromStorage = ls.device.get(['id']);

  if (deviceIdFromStorage) {
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

    return deviceId;
  }
}

export function securelyHashWalletAddress(walletAddress: string) {
  return ethers.utils.computeHmac(
    ethers.utils.SupportedAlgorithm.sha256,
    ANALYTICS_KEY,
    walletAddress
  );
}
