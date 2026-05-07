import { EthereumWalletType } from '@/helpers/walletTypes';
import { delegation } from '@rainbow-me/delegation';

import { canUseDelegatedExecution, supportsDelegatedExecution, willExecuteDelegation } from './willDelegate';

const mockGetWalletWithAccount = jest.fn();
const mockIsDelegationEnabled = jest.fn();

jest.mock('@/state/wallets/walletsStore', () => ({
  getWalletWithAccount: (accountAddress: string) => mockGetWalletWithAccount(accountAddress),
  useWalletsStore: jest.fn(),
}));

jest.mock('./featureFlags', () => ({
  isDelegationEnabled: () => mockIsDelegationEnabled(),
  useIsDelegationEnabled: jest.fn(),
}));

jest.mock('@rainbow-me/delegation', () => ({
  delegation: {
    isEnabled: jest.fn(),
    isSupported: jest.fn(),
    willDelegate: jest.fn(),
  },
  useWillDelegate: jest.fn(),
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
    jest.clearAllMocks();
    mockIsDelegationEnabled.mockReturnValue(true);
    jest.mocked(delegation.isEnabled).mockReturnValue(true);
    jest.mocked(delegation.isSupported).mockResolvedValue({ supported: true, reason: null });
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

  it('checks fresh delegation intent before showing activation UI', async () => {
    setWallet(EthereumWalletType.privateKey);
    jest.mocked(delegation.willDelegate).mockResolvedValue({
      delegation: null,
      willDelegate: false,
    });

    await expect(willExecuteDelegation({ address: ADDRESS, chainId: CHAIN_ID, requireFreshStatus: true })).resolves.toEqual({
      delegation: null,
      willDelegate: false,
    });
    expect(delegation.willDelegate).toHaveBeenCalledWith({ address: ADDRESS, chainId: CHAIN_ID, requireFreshStatus: true });
  });
});
