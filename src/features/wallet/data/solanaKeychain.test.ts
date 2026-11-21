import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as kc from '@/features/local-auth/keychain';
import { solanaKeyFromSeed } from '@/features/wallet/core/solanaAccount';

import { readSolanaKey, saveSolanaKey, SolanaAuthenticationCancelled } from './solanaKeychain';

vi.mock('@/features/local-auth/keychain', () => ({
  ErrorType: { UserCanceled: -1, Unavailable: -3 },
  getPrivateAccessControlOptions: vi.fn(),
  getObject: vi.fn(),
  setObject: vi.fn(),
  has: vi.fn(),
}));

const record = solanaKeyFromSeed(new Uint8Array(64).fill(1), 0);
const options = { accessControl: 'UserPresence', accessible: 'WhenUnlockedThisDeviceOnly' };

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(kc.getPrivateAccessControlOptions).mockResolvedValue(options as Awaited<ReturnType<typeof kc.getPrivateAccessControlOptions>>);
  vi.mocked(kc.has).mockResolvedValue(false);
  vi.mocked(kc.getObject).mockResolvedValue({ value: record, error: undefined });
});

describe('Solana keychain isolation', () => {
  it('uses the shared policy unchanged when it returns simulator options', async () => {
    vi.mocked(kc.getPrivateAccessControlOptions).mockResolvedValue({});
    await saveSolanaKey(record);
    expect(kc.setObject).toHaveBeenCalledWith(`rainbow.account-key.v1/solana/${record.address}`, record, {
      authenticationPrompt: { title: 'Authenticate to use Solana' },
    });
    const bytes = await readSolanaKey(record.address);
    expect(bytes).toHaveLength(32);
    bytes.fill(0);
    expect(kc.getObject).toHaveBeenCalledTimes(1);
  });

  it('reads through the shared keychain without requesting write access-control options', async () => {
    vi.mocked(kc.getPrivateAccessControlOptions).mockRejectedValue(new Error('Write options must not be needed for reads'));
    const bytes = await readSolanaKey(record.address);
    expect(bytes).toHaveLength(32);
    bytes.fill(0);
    expect(kc.getPrivateAccessControlOptions).not.toHaveBeenCalled();
    expect(kc.getObject).toHaveBeenCalledWith(`rainbow.account-key.v1/solana/${record.address}`, {
      authenticationPrompt: { title: 'Authenticate to use Solana' },
    });
  });

  it('writes a protected, network-independent record outside the legacy backup suffix without reading it back', async () => {
    await saveSolanaKey(record);
    expect(kc.setObject).toHaveBeenCalledWith(`rainbow.account-key.v1/solana/${record.address}`, record, {
      ...options,
      authenticationPrompt: { title: 'Authenticate to use Solana' },
    });
    expect(kc.getObject).not.toHaveBeenCalled();
    expect(vi.mocked(kc.setObject).mock.calls[0][2]).not.toHaveProperty('androidEncryptionPin');
  });

  it('propagates write failures', async () => {
    vi.mocked(kc.setObject).mockRejectedValue(new Error('Write failed'));
    await expect(saveSolanaKey(record)).rejects.toThrow('Write failed');
    expect(kc.getObject).not.toHaveBeenCalled();
  });

  it('writes the derived key even when a record already exists', async () => {
    vi.mocked(kc.has).mockResolvedValue(true);
    await saveSolanaKey(record);
    expect(kc.has).not.toHaveBeenCalled();
    expect(kc.setObject).toHaveBeenCalledTimes(1);
    expect(kc.getObject).not.toHaveBeenCalled();
  });

  it('propagates authentication cancellation when reading', async () => {
    vi.mocked(kc.getObject).mockResolvedValue({ value: undefined, error: kc.ErrorType.UserCanceled });
    await expect(readSolanaKey(record.address)).rejects.toBeInstanceOf(SolanaAuthenticationCancelled);
    expect(kc.setObject).not.toHaveBeenCalled();
    await expect(readSolanaKey(`solana:mainnet:${record.address}`)).rejects.toThrow();
  });

  it('does not expose stored content through JSON parsing errors', async () => {
    vi.mocked(kc.getObject).mockRejectedValue(new SyntaxError('unexpected secret bytes'));
    await expect(readSolanaKey(record.address)).rejects.toThrow('Unable to read the Solana key record.');
  });
});
