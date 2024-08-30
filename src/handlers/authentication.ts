import { RAINBOW_MASTER_KEY } from 'react-native-dotenv';
import AesEncryptor from '../handlers/aesEncryption';
import * as keychain from '../model/keychain';
import { Navigation } from '../navigation';
import { pinKey } from '@/utils/keychainConstants';
import Routes from '@/navigation/routesNames';
import { logger, RainbowError } from '@/logger';

const encryptor = new AesEncryptor();

export async function getExistingPIN(): Promise<string | undefined> {
  try {
    const encryptedPin = await keychain.loadString(pinKey);
    // The user has a PIN already, we need to decrypt it
    if (encryptedPin) {
      const userPIN = await encryptor.decrypt(RAINBOW_MASTER_KEY, encryptedPin);
      return userPIN as string;
    }
  } catch (error) {
    logger.error(new RainbowError('Error while trying to get existing PIN code.'), { message: (error as Error).message });
  }
  return;
}

export async function decryptPIN(encryptedPin: string): Promise<string | undefined> {
  try {
    const userPIN = await encryptor.decrypt(RAINBOW_MASTER_KEY, encryptedPin);
    return userPIN as string | undefined;
  } catch (error) {
    return;
  }
}

export async function savePIN(pin: string | undefined) {
  try {
    const encryptedPin = await encryptor.encrypt(RAINBOW_MASTER_KEY, pin);
    if (encryptedPin) {
      // @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 2.
      await keychain.saveString(pinKey, encryptedPin);
    }
  } catch (error) {
    logger.error(new RainbowError('savePin error'), {
      message: (error as Error).message,
    });
  }
}

export async function authenticateWithPINAndCreateIfNeeded(): Promise<string | undefined> {
  let validPin: string | undefined;
  try {
    validPin = await getExistingPIN();
    // eslint-disable-next-line no-empty
  } catch (e) {}
  return new Promise((resolve, reject) => {
    return Navigation.handleAction(Routes.PIN_AUTHENTICATION_SCREEN, {
      onCancel: () => reject(),
      onSuccess: async (pin: string | undefined) => {
        // If we didn't have a PIN, we need to encrypt it and store it
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

export async function authenticateWithPIN(): Promise<string | undefined> {
  let validPin: string | undefined;
  try {
    validPin = await getExistingPIN();
    // eslint-disable-next-line no-empty
  } catch (e) {}
  return new Promise((resolve, reject) => {
    return Navigation.handleAction(Routes.PIN_AUTHENTICATION_SCREEN, {
      onCancel: () => reject(),
      onSuccess: async (pin: string | undefined) => {
        resolve(pin);
      },
      validPin,
    });
  });
}
