import { IS_ANDROID, IS_DEV } from '@/env';
import { authenticateWithPINAndCreateIfNeeded, getExistingPIN } from '@/handlers/authentication';
import * as keychain from '@/keychain';

const FAKE_LOCAL_AUTH_KEY = `fake-local-auth-key`;
const FAKE_LOCAL_AUTH_VALUE = `fake-local-auth-value`;

// only for iOS
async function maybeSaveFakeAuthKey() {
  if (await keychain.has(FAKE_LOCAL_AUTH_KEY)) return;
  const options = await keychain.getPrivateAccessControlOptions();
  await keychain.set(FAKE_LOCAL_AUTH_KEY, FAKE_LOCAL_AUTH_VALUE, options);
}

export async function isAuthenticated(): Promise<boolean> {
  const hasBiometricsEnabled = await keychain.getSupportedBiometryType();
  if (hasBiometricsEnabled || !IS_ANDROID || IS_DEV) {
    await maybeSaveFakeAuthKey();
    const options = await keychain.getPrivateAccessControlOptions();
    const { value } = await keychain.get(FAKE_LOCAL_AUTH_KEY, options);
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

  return false;
}
