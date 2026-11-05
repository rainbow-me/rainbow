import { Platform } from 'react-native';

import DeviceInfo from 'react-native-device-info';
import * as native from 'react-native-keychain';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { logger } from '@/logger';
import Navigation from '@/navigation/Navigation';

import { getPrivateString, setPrivateString } from './keychain';
import { pinKey } from './keychainConstants';

const { cache, encrypt, decrypt } = vi.hoisted(() => ({
  cache: { getString: vi.fn(), set: vi.fn(), clearAll: vi.fn(), contains: vi.fn(), remove: vi.fn(), getAllKeys: vi.fn() },
  encrypt: vi.fn(),
  decrypt: vi.fn(),
}));

vi.mock('@/env', () => ({ IS_DEV: true }));
vi.mock('react-native-device-info', () => ({ default: { isEmulator: vi.fn() } }));
vi.mock('react-native-dotenv', () => ({ RAINBOW_MASTER_KEY: 'test-master' }));
vi.mock('react-native-mmkv', () => ({ createMMKV: () => cache }));
vi.mock('@/handlers/aesEncryption', () => ({
  default: class {
    encrypt = encrypt;
    decrypt = decrypt;
  },
}));
vi.mock('@/navigation/Navigation', () => ({ default: { handleAction: vi.fn() } }));
vi.mock('@/navigation/routesNames', () => ({ default: { PIN_AUTHENTICATION_SCREEN: 'PIN' } }));
vi.mock('@/logger', () => ({
  logger: { debug: vi.fn(), error: vi.fn(), warn: vi.fn(), DebugContext: {} },
  RainbowError: Error,
  ensureError: (error: unknown) => error,
}));
vi.mock('react-native-keychain', () => ({
  ACCESS_CONTROL: { USER_PRESENCE: 'presence', BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE: 'biometry-or-passcode' },
  ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'unlocked-device' },
  STORAGE_TYPE: { AES_GCM_NO_AUTH: 'aes-no-auth', RSA: 'rsa' },
  getInternetCredentials: vi.fn(),
  setInternetCredentials: vi.fn(),
  hasInternetCredentials: vi.fn(),
  getAllInternetCredentials: vi.fn(),
  getSupportedBiometryType: vi.fn(),
  isPasscodeAuthAvailable: vi.fn(),
  setSharedWebCredentials: vi.fn(),
  requestSharedWebCredentials: vi.fn(),
  resetInternetCredentials: vi.fn(),
}));

const KEY = 'rainbow.account-key.v1/wallet/0/solana/address';
const SECRET = 'serialized-private-record';
const ENCRYPTED = JSON.stringify({ cipher: 'encrypted-record', salt: 'salt', iv: 'iv' });
const credentials = (password: string) => ({ username: KEY, password, service: KEY, storage: native.STORAGE_TYPE.RSA });

beforeEach(() => {
  vi.resetAllMocks();
  (Platform as { OS: string }).OS = 'ios';
  vi.mocked(DeviceInfo.isEmulator).mockResolvedValue(false);
  vi.mocked(native.isPasscodeAuthAvailable).mockResolvedValue(true);
  vi.mocked(native.getInternetCredentials).mockResolvedValue(credentials(SECRET));
  vi.mocked(native.setInternetCredentials).mockResolvedValue({ service: KEY, storage: native.STORAGE_TYPE.RSA });
  vi.mocked(native.hasInternetCredentials).mockResolvedValue(false);
  encrypt.mockResolvedValue(ENCRYPTED);
  decrypt.mockImplementation(async (password: string) => (password === 'test-master' ? '1234' : SECRET));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('private-only keychain primitives', () => {
  it('bypasses the public cache and applies protection without passing or logging the PIN', async () => {
    const auth = { androidEncryptionPin: '1234', authenticationPrompt: { title: 'Authenticate' } };
    cache.getString.mockReturnValue('stale-public-copy');
    await expect(getPrivateString(KEY, auth)).resolves.toEqual({ status: 'ok', value: SECRET });
    await expect(setPrivateString(KEY, SECRET, auth)).resolves.toEqual({ status: 'ok', value: undefined });
    expect(cache.getString).not.toHaveBeenCalled();
    expect(cache.set).not.toHaveBeenCalled();
    expect(native.setInternetCredentials).toHaveBeenCalledWith(KEY, KEY, SECRET, {
      accessControl: 'presence',
      accessible: 'unlocked-device',
      storage: 'rsa',
      authenticationPrompt: auth.authenticationPrompt,
    });
    expect(JSON.stringify(vi.mocked(logger.debug).mock.calls)).not.toContain('1234');
    expect(JSON.stringify(vi.mocked(logger.debug).mock.calls)).not.toContain(SECRET);
  });

  it('fails closed when the simulator would supply unprotected options', async () => {
    vi.mocked(DeviceInfo.isEmulator).mockResolvedValue(true);
    await expect(getPrivateString(KEY)).resolves.toEqual({ status: 'unavailable' });
    await expect(setPrivateString(KEY, SECRET)).resolves.toEqual({ status: 'unavailable' });
    expect(native.getInternetCredentials).not.toHaveBeenCalled();
    expect(native.setInternetCredentials).not.toHaveBeenCalled();
    expect(cache.set).not.toHaveBeenCalled();
  });

  it('distinguishes an absent item from an unsuccessful write', async () => {
    vi.mocked(native.getInternetCredentials).mockResolvedValue(false);
    vi.mocked(native.setInternetCredentials).mockResolvedValue(false);
    await expect(getPrivateString(KEY)).resolves.toEqual({ status: 'missing-key' });
    await expect(setPrivateString(KEY, SECRET)).resolves.toEqual({ status: 'unavailable' });
  });

  it.each([
    [Object.assign(new Error('cancelled'), { code: '-128' }), 'cancelled'],
    [new Error('code: 13, msg: cancelled'), 'cancelled'],
    [new Error('User canceled the operation.'), 'cancelled'],
    [Object.assign(new Error('authentication'), { code: -25293 }), 'not-authenticated'],
    [new Error('Wrapped error: User not authenticated'), 'not-authenticated'],
    [new Error('code: 7, msg: Too many attempts'), 'not-authenticated'],
    [new Error(`unknown error containing ${SECRET}`), 'unavailable'],
  ])('preserves native failure %# without logging its contents', async (error, status) => {
    vi.mocked(native.getInternetCredentials).mockRejectedValue(error);
    vi.mocked(native.setInternetCredentials).mockRejectedValue(error);
    await expect(getPrivateString(KEY)).resolves.toEqual({ status });
    await expect(setPrivateString(KEY, SECRET)).resolves.toEqual({ status });
    expect(logger.error).not.toHaveBeenCalled();
    expect(JSON.stringify(vi.mocked(logger.debug).mock.calls)).not.toContain(SECRET);
  });

  describe('Android PIN fallback', () => {
    beforeEach(() => {
      (Platform as { OS: string }).OS = 'android';
      vi.mocked(native.isPasscodeAuthAvailable).mockResolvedValue(false);
      cache.getString.mockImplementation((key: string) => (key === pinKey ? 'encrypted-pin' : undefined));
      vi.mocked(native.getInternetCredentials).mockImplementation(async key => credentials(key === pinKey ? 'encrypted-pin' : SECRET));
    });

    it('encrypts before native persistence and decrypts without caching the private record', async () => {
      await expect(setPrivateString(KEY, SECRET, { androidEncryptionPin: '1234' })).resolves.toEqual({ status: 'ok', value: undefined });
      expect(encrypt).toHaveBeenCalledWith('1234', SECRET);
      expect(native.setInternetCredentials).toHaveBeenCalledWith(KEY, KEY, ENCRYPTED, expect.objectContaining({ storage: 'aes-no-auth' }));
      vi.mocked(native.getInternetCredentials).mockResolvedValueOnce(credentials(ENCRYPTED));
      await expect(getPrivateString(KEY, { androidEncryptionPin: '1234' })).resolves.toEqual({ status: 'ok', value: SECRET });
      expect(cache.getString).not.toHaveBeenCalledWith(KEY);
      expect(cache.set).not.toHaveBeenCalled();
      expect(JSON.stringify(vi.mocked(logger.debug).mock.calls)).not.toContain('1234');
    });

    it('does not treat a supplied PIN as proof of authentication', async () => {
      await expect(setPrivateString(KEY, SECRET, { androidEncryptionPin: 'wrong' })).resolves.toEqual({ status: 'not-authenticated' });
      expect(encrypt).not.toHaveBeenCalled();
      expect(native.setInternetCredentials).not.toHaveBeenCalled();
    });

    it('does not persist plaintext after encryption failure', async () => {
      encrypt.mockResolvedValue(undefined);
      await expect(setPrivateString(KEY, SECRET, { androidEncryptionPin: '1234' })).resolves.toEqual({ status: 'unavailable' });
      expect(native.setInternetCredentials).not.toHaveBeenCalled();
    });

    it('does not release unencrypted Android values when native authentication is unavailable', async () => {
      await expect(getPrivateString(KEY)).resolves.toEqual({ status: 'not-authenticated' });
    });

    it('still decrypts PIN-protected records after device authentication is enabled', async () => {
      vi.mocked(native.isPasscodeAuthAvailable).mockResolvedValue(true);
      vi.mocked(native.getInternetCredentials).mockResolvedValueOnce(credentials(ENCRYPTED));
      await expect(getPrivateString(KEY, { androidEncryptionPin: '1234' })).resolves.toEqual({ status: 'ok', value: SECRET });
    });

    it('does not replace an existing PIN when its value is unreadable', async () => {
      decrypt.mockResolvedValue(undefined);
      vi.mocked(native.hasInternetCredentials).mockResolvedValue(true);
      await expect(setPrivateString(KEY, SECRET)).resolves.toEqual({ status: 'unavailable' });
      expect(Navigation.handleAction).not.toHaveBeenCalled();
      expect(native.setInternetCredentials).not.toHaveBeenCalled();
    });

    it('rejects a cached PIN that never reached native storage', async () => {
      vi.mocked(native.getInternetCredentials).mockResolvedValue(false);
      await expect(setPrivateString(KEY, SECRET, { androidEncryptionPin: '1234' })).resolves.toEqual({ status: 'not-authenticated' });
      expect(native.setInternetCredentials).not.toHaveBeenCalled();
    });

    it('does not mistake a corrupt encrypted record for a missing key', async () => {
      vi.mocked(native.getInternetCredentials).mockResolvedValueOnce(credentials(ENCRYPTED));
      decrypt.mockImplementation(async password => (password === 'test-master' ? '1234' : undefined));
      await expect(getPrivateString(KEY, { androidEncryptionPin: '1234' })).resolves.toEqual({ status: 'unavailable' });
    });

    it('preserves cancellation from the PIN screen', async () => {
      vi.useFakeTimers();
      vi.mocked(Navigation.handleAction).mockImplementation((...args) => {
        (args[1] as { onCancel: () => void }).onCancel();
      });
      const result = setPrivateString(KEY, SECRET);
      await vi.runAllTimersAsync();
      await expect(result).resolves.toEqual({ status: 'cancelled' });
      expect(native.setInternetCredentials).not.toHaveBeenCalled();
    });
  });
});
