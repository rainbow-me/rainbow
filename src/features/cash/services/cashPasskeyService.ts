import DeviceInfo from 'react-native-device-info';
import { create, get } from 'react-native-passkeys';

import { IS_CASH_MOCK } from '@/env';
import { time } from '@/framework/core/utils/time';
import { delay } from '@/utils/delay';

type PasskeyCreationOptions = Parameters<typeof create>[0];
type PasskeyRequestOptions = Parameters<typeof get>[0];

function parsePasskeyRequestOptions(publicKeyOptionsJson: string): PasskeyRequestOptions {
  const parsed: unknown = JSON.parse(publicKeyOptionsJson);
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('publicKey' in parsed) ||
    typeof parsed.publicKey !== 'object' ||
    parsed.publicKey === null ||
    !('challenge' in parsed.publicKey) ||
    typeof parsed.publicKey.challenge !== 'string' ||
    !parsed.publicKey.challenge
  ) {
    throw new Error('Invalid passkey request options');
  }

  return { ...parsed.publicKey, challenge: parsed.publicKey.challenge };
}

export async function createPasskeyCredential(publicKeyOptionsJson: string): Promise<string> {
  if (IS_CASH_MOCK) {
    await delay(time.seconds(1));
    return '{}';
  }

  // The backend wraps the WebAuthn options in a `publicKey` envelope
  const { publicKey } = JSON.parse(publicKeyOptionsJson) as { publicKey: PasskeyCreationOptions };
  const credential = await create(publicKey);
  if (!credential) throw new Error('Passkey creation returned no credential');
  return JSON.stringify(credential);
}

export async function getPasskeyAssertion(publicKeyOptionsJson: string): Promise<string> {
  if (IS_CASH_MOCK) {
    await delay(time.seconds(1));
    return '{}';
  }

  const publicKey = parsePasskeyRequestOptions(publicKeyOptionsJson);
  const assertion = await get(publicKey);
  if (!assertion) throw new Error('Passkey assertion returned no credential');
  return JSON.stringify(assertion);
}

export function isPasskeyCancellation(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const code = 'code' in error && typeof error.code === 'string' ? error.code : '';
  return code === 'ERR_USER_CANCELLED' || error.message === 'UserCancelled';
}

export function getPasskeyName(): string {
  return DeviceInfo.getModel() || 'passkey';
}
