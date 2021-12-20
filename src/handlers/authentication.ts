import { captureException } from '@sentry/react-native';
// @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
import { RAINBOW_MASTER_KEY } from 'react-native-dotenv';
import AesEncryptor from '../handlers/aesEncryption';
import * as keychain from '../model/keychain';
import { Navigation } from '../navigation';
import { pinKey } from '../utils/keychainConstants';
import Routes from '@rainbow-me/routes';
import logger from 'logger';

const encryptor = new AesEncryptor();

export async function getExistingPIN() {
  try {
    const encryptedPin = await keychain.loadString(pinKey);
    // The user has a PIN already, we need to decrypt it
    if (encryptedPin) {
      const userPIN = await encryptor.decrypt(RAINBOW_MASTER_KEY, encryptedPin);
      return userPIN;
    }
    // eslint-disable-next-line no-empty
  } catch (e) {}
  return null;
}

export async function savePIN(pin: any) {
  try {
    const encryptedPin = await encryptor.encrypt(RAINBOW_MASTER_KEY, pin);
    if (encryptedPin) {
      // @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 2.
      await keychain.saveString(pinKey, encryptedPin);
    }
  } catch (e) {
    logger.sentry('Error saving pin');
    captureException(e);
  }
}

export async function authenticateWithPIN() {
  let validPin: any;
  try {
    validPin = await getExistingPIN();
    // eslint-disable-next-line no-empty
  } catch (e) {}
  return new Promise((resolve, reject) => {
    return Navigation.handleAction(Routes.PIN_AUTHENTICATION_SCREEN, {
      onCancel: () => reject(),
      onSuccess: async (pin: any) => {
        // If we didn't have a PIN we need to encrypt it and store it
        if (!validPin) {
          try {
            await savePIN(pin);
          } catch (e) {
            reject();
          }
        }
        resolve(pin);
      },
      validPin,
    });
  });
}
