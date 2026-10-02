import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EthereumWalletType } from '@/helpers/walletTypes';
import { delegation } from '@rainbow-me/sdk';

import { canUseDelegatedExecution, supportsDelegatedExecution } from './willDelegate';

const mockGetWalletWithAccount = vi.fn();
const mockIsDelegationEnabled = vi.fn();

vi.mock('@/state/wallets/walletsStore', () => ({
  getWalletWithAccount: (accountAddress: string) => mockGetWalletWithAccount(accountAddress),
  useWalletsStore: vi.fn(),
}));

vi.mock('./featureFlags', () => ({
  isDelegationEnabled: () => mockIsDelegationEnabled(),
  useIsDelegationEnabled: vi.fn(),
}));

vi.mock('@rainbow-me/sdk', () => ({
  delegation: {
    isEnabled: vi.fn(),
    isSupported: vi.fn(),
    willDelegate: vi.fn(),
  },
  useWillDelegate: vi.fn(),
}));

const ADDRESS = '0x1111111111111111111111111111111111111111';
const CHAIN_ID = 8453;

function setWallet(type: EthereumWalletType) {
  mockGetWalletWithAccount.mockReturnValue({
    addresses: [],
    type,
  });
}

describe('delegation wallet gating', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsDelegationEnabled.mockReturnValue(true);
    vi.mocked(delegation.isEnabled).mockReturnValue(true);
    vi.mocked(delegation.isSupported).mockResolvedValue({ supported: true, reason: null });
  });

  it('rejects hardware wallets even when their optional deviceId is missing', async () => {
    setWallet(EthereumWalletType.bluetooth);

    expect(canUseDelegatedExecution(ADDRESS)).toBe(false);
    await expect(supportsDelegatedExecution({ address: ADDRESS, chainId: CHAIN_ID })).resolves.toBe(false);
    expect(delegation.isSupported).not.toHaveBeenCalled();
  });

  it('delegates software wallets through SDK support', async () => {
    setWallet(EthereumWalletType.privateKey);

    await expect(supportsDelegatedExecution({ address: ADDRESS, chainId: CHAIN_ID })).resolves.toBe(true);
    expect(delegation.isSupported).toHaveBeenCalledWith({ address: ADDRESS, chainId: CHAIN_ID });
  });
});
