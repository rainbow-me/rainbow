import {
  getSupportedBiometryType,
  hasInternetCredentials,
} from 'react-native-keychain';

import { IS_ANDROID } from '@/env';
import * as keychain from '@/model/keychain';
import {
  authenticateWithPINAndCreateIfNeeded,
  getExistingPIN,
} from '@/handlers/authentication';

const FAKE_LOCAL_AUTH_KEY = `fake-local-auth-key`;
const FAKE_LOCAL_AUTH_VALUE = `fake-local-auth-value`;

// only for iOS
async function maybeSaveFakeAuthKey() {
  if (await hasInternetCredentials(FAKE_LOCAL_AUTH_KEY)) return;
  const options = await keychain.getPrivateAccessControlOptions();
  await keychain.saveString(
    FAKE_LOCAL_AUTH_KEY,
    FAKE_LOCAL_AUTH_VALUE,
    options
  );
}

export async function isAuthenticated() {
  const hasBiometricsEnabled = await getSupportedBiometryType();
  if (hasBiometricsEnabled) {
    await maybeSaveFakeAuthKey();
    const options = await keychain.getPrivateAccessControlOptions();
    const value = await keychain.loadString(FAKE_LOCAL_AUTH_KEY, options);
    return Boolean(value === FAKE_LOCAL_AUTH_VALUE);
  } else if (!hasBiometricsEnabled && IS_ANDROID) {
    // if user does not have biometrics enabled, we fallback to PIN
    try {
      const pin = await authenticateWithPINAndCreateIfNeeded();
      return Boolean(pin === (await getExistingPIN()));
    } catch (e) {
      // authenticatePin will throw if user rejects pin screen
      return false;
    }
  }
}
