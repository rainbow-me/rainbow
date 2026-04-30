import { parseUnits } from 'viem';

import { RNBW_DECIMALS } from '../constants';
import { resolveStakeClaimStrategy } from './resolveStakeClaimStrategy';

const mockFetch = jest.fn();
const mockGetData = jest.fn();
const mockHasClaimableRewards = jest.fn();

jest.mock('@/utils/ethereumUtils', () => ({
  getUniqueId: (address: string, chainId: number) => `${chainId}:${address}`,
}));

jest.mock('@/features/rnbw-rewards/stores/rewardsBalanceStore', () => ({
  useRewardsBalanceStore: {
    getState: () => ({
      fetch: mockFetch,
      getData: mockGetData,
      hasClaimableRewards: mockHasClaimableRewards,
    }),
  },
}));

function raw(amount: string): string {
  return parseUnits(amount, RNBW_DECIMALS).toString();
}

function setClaimableRnbw(claimableRnbw: string): void {
  mockGetData.mockReturnValue({ claimableRnbw });
  mockHasClaimableRewards.mockReturnValue(claimableRnbw !== '0');
}

describe('resolveStakeClaimStrategy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('claims sub-threshold rewards to wallet and stakes the full requested amount from wallet balance', async () => {
    setClaimableRnbw(raw('0.4'));

    await expect(resolveStakeClaimStrategy(raw('100'))).resolves.toEqual({
      claimToDestination: 'wallet',
      requiredWalletBalanceRaw: raw('99.6'),
      walletStakeAmountRaw: raw('100'),
      claimFulfillsStake: false,
    });
    expect(mockFetch).toHaveBeenCalledWith(undefined, { force: true });
  });

  it('claims threshold-sized partial rewards directly to staking and stakes only the wallet remainder', async () => {
    setClaimableRnbw(raw('20'));

    await expect(resolveStakeClaimStrategy(raw('100'))).resolves.toEqual({
      claimToDestination: 'staking',
      requiredWalletBalanceRaw: raw('80'),
      walletStakeAmountRaw: raw('80'),
      claimFulfillsStake: false,
    });
  });

  it('uses a threshold-sized exact claim as the complete stake', async () => {
    setClaimableRnbw(raw('20'));

    await expect(resolveStakeClaimStrategy(raw('20'))).resolves.toEqual({
      claimToDestination: 'staking',
      requiredWalletBalanceRaw: '0',
      walletStakeAmountRaw: '0',
      claimFulfillsStake: true,
    });
  });
});
