import { RAINBOW_MASTER_KEY } from 'react-native-dotenv';
import AesEncryptor from '../handlers/aesEncryption';
import * as keychain from '../model/keychain';
import * as kc from '@/keychain';
import { Navigation } from '../navigation';
import { pinKey } from '@/utils/keychainConstants';
import Routes from '@/navigation/routesNames';
import { logger, RainbowError } from '@/logger';
import { IS_ANDROID } from '@/env';

const encryptor = new AesEncryptor();

// Add a short delay to give time for the screen to close.
// this prevents an issue where the PIN screen won't show if
// shown twice in a row. Ideally we should never prompt twice
// in a row, but this is better than never resolving the promise.
function waitForNavigation(callback: () => void) {
  setTimeout(callback, 500);
}

export async function getExistingPIN(): Promise<string | undefined> {
  try {
    const encryptedPin = await keychain.loadString(pinKey);
    // The user has a PIN already, we need to decrypt it
    if (encryptedPin) {
      const userPIN = await encryptor.decrypt(RAINBOW_MASTER_KEY, encryptedPin);
      return userPIN as string;
    }
  } catch (error) {
    logger.error(new RainbowError('[getExistingPIN]: Error while trying to get existing PIN code.'), {
      message: (error as Error).message,
    });
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
    logger.error(new RainbowError('[savePIN]: savePin error'), {
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
    Navigation.handleAction(Routes.PIN_AUTHENTICATION_SCREEN, {
      onCancel: () => {
        waitForNavigation(reject);
      },
      onSuccess: (pin: string | undefined) => {
        waitForNavigation(async () => {
          // If we didn't have a PIN, we need to encrypt it and store it
          if (!validPin) {
            try {
              await savePIN(pin);
            } catch (e) {
              reject();
            }
          }
          resolve(pin);
        });
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
    Navigation.handleAction(Routes.PIN_AUTHENTICATION_SCREEN, {
      onCancel: () => {
        waitForNavigation(reject);
      },
      onSuccess: async (pin: string | undefined) => {
        waitForNavigation(() => {
          resolve(pin);
        });
      },
      validPin,
    });
  });
}

export async function shouldAuthenticateWithPIN(): Promise<boolean> {
  if (!IS_ANDROID) {
    return false;
  }

  const hasPasscode = await kc.isPasscodeAuthAvailable();
  return !hasPasscode;
}

export async function maybeAuthenticateWithPIN(): Promise<string | undefined> {
  if (!(await shouldAuthenticateWithPIN())) {
    return undefined;
  }
  return (await authenticateWithPIN()) ?? undefined;
}

export async function maybeAuthenticateWithPINAndCreateIfNeeded(userPin?: string): Promise<string | undefined> {
  if (!(await shouldAuthenticateWithPIN())) {
    return undefined;
  }
  return userPin ?? (await authenticateWithPINAndCreateIfNeeded()) ?? undefined;
}
