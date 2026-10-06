import { create, get } from 'react-native-passkeys';
import { beforeEach, expect, test, vi, type Mock } from 'vitest';

import { createPasskeyCredential, getPasskeyAssertion } from './cashPasskeyService';

vi.mock('react-native-device-info', () => ({ getModel: vi.fn() }));
vi.mock('react-native-dotenv', () => ({ IS_TESTING: 'false' }));
vi.mock('react-native-passkeys', () => ({
  create: vi.fn(),
  get: vi.fn(),
}));

const mockCreate = create as Mock;
const mockGet = get as Mock;

beforeEach(() => {
  mockCreate.mockReset();
  mockGet.mockReset();
});

test('requests a discoverable passkey when the backend leaves residentKey unset', async () => {
  mockCreate.mockResolvedValue({ id: 'credential-id' });
  const publicKey = {
    challenge: 'challenge',
    rp: { id: 'rainbow.me', name: 'ZITADEL' },
    user: { id: 'user-id', name: '+15555550100', displayName: '- -' },
    pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
    authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' },
  };

  await expect(createPasskeyCredential(JSON.stringify({ publicKey }))).resolves.toBe('{"id":"credential-id"}');
  expect(mockCreate).toHaveBeenCalledWith({
    ...publicKey,
    authenticatorSelection: { ...publicKey.authenticatorSelection, residentKey: 'required', requireResidentKey: true },
  });
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
