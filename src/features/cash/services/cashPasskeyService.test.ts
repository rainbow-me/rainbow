import { get } from 'react-native-passkeys';

import { getPasskeyAssertion } from './cashPasskeyService';

jest.mock('react-native-device-info', () => ({ getModel: jest.fn() }));
jest.mock('react-native-dotenv', () => ({ IS_TESTING: 'false' }));
jest.mock('react-native-passkeys', () => ({
  create: jest.fn(),
  get: jest.fn(),
}));

const mockGet = get as jest.Mock;

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
