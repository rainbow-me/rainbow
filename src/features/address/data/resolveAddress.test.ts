import { beforeEach, expect, it, vi } from 'vitest';

import { resolveEnsAddress } from '@/features/ens/data/ens';
import { ChainId } from '@/features/network/types/backendNetworks';

import { isValidAddressOrDomain, resolveNameOrAddress } from './resolveAddress';

const { resolveUd } = vi.hoisted(() => ({ resolveUd: vi.fn() }));
vi.mock('@unstoppabledomains/resolution', () => ({
  default: class {
    addr = resolveUd;
  },
}));
vi.mock('@/features/ens/data/ens', () => ({ resolveEnsAddress: vi.fn() }));
vi.mock('@/logger', () => ({ logger: { error: vi.fn() }, RainbowError: Error }));

const ENS_ADDRESS = '0x1111111111111111111111111111111111111111';
const UD_ADDRESS = '0x2222222222222222222222222222222222222222';

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(resolveEnsAddress).mockResolvedValue(ENS_ADDRESS);
  resolveUd.mockResolvedValue(UD_ADDRESS);
});

it('routes DNS names to the requested ENS chain and Unstoppable names to their Ethereum address', async () => {
  const signal = new AbortController().signal;
  await expect(resolveNameOrAddress(' sub.alice.xyz ', ChainId.base, signal)).resolves.toBe(ENS_ADDRESS);
  expect(resolveEnsAddress).toHaveBeenCalledExactlyOnceWith('sub.alice.xyz', ChainId.base, signal);
  await expect(resolveNameOrAddress('alice.crypto', ChainId.base)).resolves.toBe(UD_ADDRESS);
  expect(resolveUd).toHaveBeenCalledExactlyOnceWith('alice.crypto', 'ETH');
  expect(resolveEnsAddress).toHaveBeenCalledTimes(1);
});

it('resolves literal addresses locally and rejects malformed or bad-checksum input without a lookup', async () => {
  await expect(resolveNameOrAddress(ENS_ADDRESS, ChainId.base)).resolves.toBe(ENS_ADDRESS);
  for (const input of ['alice..xyz', '0x123.xyz', '0x52908400098527886E0F7030069857D2E4169Ee7']) {
    await expect(resolveNameOrAddress(input, ChainId.base)).resolves.toBeNull();
  }
  expect(resolveEnsAddress).not.toHaveBeenCalled();
  expect(resolveUd).not.toHaveBeenCalled();
});

it('preserves resolution failures while the legacy existence check returns false', async () => {
  const failure = new Error('ENS unavailable');
  vi.mocked(resolveEnsAddress).mockRejectedValue(failure);
  await expect(resolveNameOrAddress('alice.xyz', ChainId.base)).rejects.toBe(failure);
  await expect(isValidAddressOrDomain('alice.xyz')).resolves.toBe(false);
  expect(resolveEnsAddress).toHaveBeenLastCalledWith('alice.xyz', ChainId.mainnet, undefined);
  resolveUd.mockRejectedValue(new Error('UD unavailable'));
  await expect(resolveNameOrAddress('alice.crypto', ChainId.base)).resolves.toBeNull();
});
