import DeviceInfo from 'react-native-device-info';
import { IS_TESTING } from 'react-native-dotenv';
import { create } from 'react-native-passkeys';

import { time } from '@/framework/core/utils/time';
import { delay } from '@/utils/delay';

type PasskeyCreationOptions = Parameters<typeof create>[0];

export async function createPasskeyCredential(publicKeyOptionsJson: string): Promise<string> {
  if (IS_TESTING === 'true') {
    await delay(time.seconds(1));
    return '{}';
  }

  // The backend wraps the WebAuthn options in a `publicKey` envelope
  const { publicKey } = JSON.parse(publicKeyOptionsJson) as { publicKey: PasskeyCreationOptions };
  const credential = await create(publicKey);
  if (!credential) throw new Error('Passkey creation returned no credential');
  return JSON.stringify(credential);
}

export function isPasskeyCancellation(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const code = 'code' in error && typeof error.code === 'string' ? error.code : '';
  return code === 'ERR_USER_CANCELLED' || error.message === 'UserCancelled';
}

export function getPasskeyName(): string {
  return DeviceInfo.getModel() || 'passkey';
}
