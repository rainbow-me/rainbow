import { get } from 'react-native-passkeys';
import { beforeEach, expect, test, vi, type Mock } from 'vitest';

import { getPasskeyAssertion, isPasskeyAlreadyOnDevice } from './cashPasskeyService';

vi.mock('react-native-device-info', () => ({ getModel: vi.fn() }));
vi.mock('react-native-dotenv', () => ({ IS_TESTING: 'false' }));
vi.mock('react-native-passkeys', () => ({
  create: vi.fn(),
  get: vi.fn(),
}));

const mockGet = get as Mock;

beforeEach(() => {
  mockGet.mockReset();
});

test('passes validated request options to the native passkey module', async () => {
  mockGet.mockResolvedValue({ id: 'credential-id' });
  const publicKey = { challenge: 'challenge', rpId: 'rainbow.me', timeout: 60_000 };

  await expect(getPasskeyAssertion(JSON.stringify({ publicKey }))).resolves.toBe('{"id":"credential-id"}');
  expect(mockGet).toHaveBeenCalledWith(publicKey);
});

test.each([
  ['a missing publicKey envelope', '{}'],
  ['a null publicKey value', '{"publicKey":null}'],
  ['a missing challenge', '{"publicKey":{}}'],
  ['an empty challenge', '{"publicKey":{"challenge":""}}'],
  ['a non-string challenge', '{"publicKey":{"challenge":123}}'],
])('rejects %s', async (_, publicKeyOptionsJson) => {
  await expect(getPasskeyAssertion(publicKeyOptionsJson)).rejects.toThrow('Invalid passkey request options');
  expect(mockGet).not.toHaveBeenCalled();
});

function nativeError(message: string, code: string): Error {
  return Object.assign(new Error(message), { code });
}

test.each([
  ['the iOS excluded-credential code', true, nativeError('The operation couldn’t be completed.', 'ERR_PASSKEY_EXCLUDED_CREDENTIAL')],
  [
    "Android's InvalidStateError",
    true,
    nativeError('DomError: InvalidStateError - A credential for this account already exists', 'Passkey Create'),
  ],
  ['another Android DOM error', false, nativeError('DomError: NotAllowedError - The operation is not allowed', 'Passkey Create')],
  ['an unmapped iOS error', false, nativeError('The operation couldn’t be completed.', 'ERR_UNKNOWN')],
  ['a cancellation', false, nativeError('User cancelled the passkey interaction', 'ERR_USER_CANCELLED')],
])('treats %s as a passkey already on the device: %s', (_, expected, error) => {
  expect(isPasskeyAlreadyOnDevice(error)).toBe(expected);
});
