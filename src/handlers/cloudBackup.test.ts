import { beforeEach, describe, expect, jest, test } from '@jest/globals';

import { CLOUD_BACKUP_ERRORS, getDataFromCloud, parseBackupJson } from './cloudBackup';

jest.mock('react-native-cloud-fs', () => ({
  getIcloudDocument: jest.fn(() => Promise.resolve('encrypted-blob')),
  listFiles: jest.fn(() => Promise.resolve({ files: [{ id: 'file-id', name: 'UserData.json' }] })),
  loginIfNeeded: jest.fn(),
}));

jest.mock('react-native-fs', () => ({ unlink: jest.fn(), writeFile: jest.fn() }));

jest.mock('./aesEncryption', () => {
  const state = { plaintext: '' };

  return {
    __esModule: true,
    default: class AesEncryptor {
      decrypt() {
        return Promise.resolve(state.plaintext);
      }
    },
    state,
  };
});

const encryptor = jest.requireMock<{ state: { plaintext: string } }>('./aesEncryption');

// Decryption has already succeeded by the time the parse runs, so what fails to parse here is
// decrypted backup contents. A phrase is the worst case that can be sitting in it.
const DECRYPTED_PLAINTEXT = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

describe('getDataFromCloud', () => {
  beforeEach(() => {
    encryptor.state.plaintext = '';
  });

  test('returns the backup when it parses', async () => {
    encryptor.state.plaintext = JSON.stringify({ wallets: { id: 'wallet' } });

    await expect(getDataFromCloud('password', 'UserData.json')).resolves.toEqual({ wallets: { id: 'wallet' } });
  });

  test('reports a malformed backup as its own error, not as a wrong password', async () => {
    // Reusing ERROR_DECRYPTING_DATA would tell the user their password was wrong and drop the report,
    // because restoreCloudBackup matches that constant and returns before it reaches logger.error.
    encryptor.state.plaintext = DECRYPTED_PLAINTEXT;

    const error = await getDataFromCloud('password', 'UserData.json').catch((e: Error) => e);

    expect(error.message).toBe(CLOUD_BACKUP_ERRORS.MALFORMED_BACKUP_DATA);
    expect(error.message).not.toBe(CLOUD_BACKUP_ERRORS.ERROR_DECRYPTING_DATA);
  });

  test('keeps the plaintext it failed to parse out of the error it throws', async () => {
    // JSON.parse quotes its own input back inside the SyntaxError, e.g. `Unexpected token 'a',
    // "abandon ab"... is not valid JSON`. That error must not be what travels onward.
    encryptor.state.plaintext = DECRYPTED_PLAINTEXT;

    const error = await getDataFromCloud('password', 'UserData.json').catch((e: Error) => e);

    expect(error.message).toBe(CLOUD_BACKUP_ERRORS.MALFORMED_BACKUP_DATA);
    expect(error.message).not.toContain('abandon');
    expect(error.message).not.toContain('is not valid JSON');
  });
});

describe('parseBackupJson', () => {
  test('parses a well-formed entry', () => {
    expect(parseBackupJson('{"seedphrase":"secret"}')).toEqual({ seedphrase: 'secret' });
  });

  test('reports malformed data without quoting what it failed to parse', () => {
    let error!: Error;
    try {
      parseBackupJson(DECRYPTED_PLAINTEXT);
    } catch (e) {
      error = e as Error;
    }

    expect(error.message).toBe(CLOUD_BACKUP_ERRORS.MALFORMED_BACKUP_DATA);
    expect(error.message).not.toContain('abandon');
  });

  test('carries no cause, so the parse error cannot travel onward as one', () => {
    // Attaching the SyntaxError as a cause would put the quoted fragment back into telemetry, and
    // the seed-phrase rule needs eight consecutive wordlist words to catch it.
    let error!: Error;
    try {
      parseBackupJson(DECRYPTED_PLAINTEXT);
    } catch (e) {
      error = e as Error;
    }

    expect(error.message).toBe(CLOUD_BACKUP_ERRORS.MALFORMED_BACKUP_DATA);
    expect(error.cause).toBeUndefined();
  });
});

describe('CLOUD_BACKUP_ERRORS', () => {
  test('appends new errors, because getUserError shows users the index as an error code', () => {
    // getUserError's default branch reports values(CLOUD_BACKUP_ERRORS).indexOf(message), so
    // inserting anywhere above the end silently renumbers the codes users are told to quote.
    const messages = Object.values(CLOUD_BACKUP_ERRORS);

    expect(messages.indexOf(CLOUD_BACKUP_ERRORS.WRONG_PIN)).toBe(10);
    expect(messages[messages.length - 1]).toBe(CLOUD_BACKUP_ERRORS.MALFORMED_BACKUP_DATA);
  });
});
