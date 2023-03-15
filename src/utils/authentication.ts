import { hasInternetCredentials } from 'react-native-keychain';

import { IS_IOS } from '@/env';
import * as keychain from '@/model/keychain';
import { authenticateWithPIN, getExistingPIN } from '@/handlers/authentication';

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
  if (IS_IOS) {
    await maybeSaveFakeAuthKey();
    const options = await keychain.getPrivateAccessControlOptions();
    const value = await keychain.loadString(FAKE_LOCAL_AUTH_KEY, options);
    return Boolean(value === FAKE_LOCAL_AUTH_VALUE);
  } else {
    try {
      const pin = await authenticateWithPIN();
      return Boolean(pin === (await getExistingPIN()));
    } catch (e) {
      // authenticatePin will throw if user rejects pin screen
      return false;
    }
  }
}
