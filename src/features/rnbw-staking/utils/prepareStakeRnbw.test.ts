import { type Address } from 'viem';

import { type Call, type CallsRequirements } from '@rainbow-me/delegation';

import { STAKING_CHAIN_ID, STAKING_CONTRACT_ADDRESS } from '../constants';
import { prepareStakeRnbw, type StakeRnbwPreparationParams } from './prepareStakeRnbw';

const mockPrepareCalls = jest.fn<Promise<unknown>, [unknown]>();
const mockBuildStakeRnbwExecutionPlan = jest.fn<Promise<{ calls: Call[]; requirements?: CallsRequirements }>, [unknown]>();
const mockGetProvider = jest.fn();
const mockResolveStakeClaimStrategy = jest.fn<Promise<unknown>, [string]>();

jest.mock('@rainbow-me/delegation', () => ({
  execute: {
    prepare: {
      calls: (params: unknown) => mockPrepareCalls(params),
    },
  },
}));

jest.mock('@/handlers/web3', () => ({
  getProvider: () => mockGetProvider(),
}));

jest.mock('@/state/backendNetworks/backendNetworks', () => ({
  backendNetworksActions: {
    getChainDefaultRpc: () => 'http://127.0.0.1:8545',
    getDefaultChains: () => ({
      8453: {
        id: 8453,
        name: 'Base',
        nativeCurrency: { decimals: 18, name: 'Ether', symbol: 'ETH' },
        rpcUrls: { default: { http: ['http://127.0.0.1:8545'] } },
      },
    }),
  },
}));

jest.mock('@/utils/ethereumUtils', () => ({
  getUniqueId: (address: string, chainId: number) => `${address}_${chainId}`,
}));

jest.mock('./resolveStakeClaimStrategy', () => ({
  resolveStakeClaimStrategy: (stakeAmountRaw: string) => mockResolveStakeClaimStrategy(stakeAmountRaw),
}));

jest.mock('./stakeRnbwCalls', () => ({
  buildStakeRnbwExecutionPlan: (params: unknown) => mockBuildStakeRnbwExecutionPlan(params),
}));

const ACCOUNT = '0x3333333333333333333333333333333333333333' satisfies Address;
const STAKE_AMOUNT_RAW = '1000000000000000000';
const provider = { name: 'provider' };
const STAKE_CALL = { data: '0x1234', to: STAKING_CONTRACT_ADDRESS, value: 0n } satisfies Call;
const SPONSORED_REQUIREMENTS = { atomic: 'required', fees: { payer: 'sponsor' } } satisfies CallsRequirements;

describe('prepareStakeRnbw', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetProvider.mockReturnValue(provider);
    mockBuildStakeRnbwExecutionPlan.mockResolvedValue({ calls: [STAKE_CALL], requirements: SPONSORED_REQUIREMENTS });
    mockResolveStakeClaimStrategy.mockResolvedValue({
      claimFulfillsStake: false,
      claimToDestination: 'wallet',
      requiredWalletBalanceRaw: STAKE_AMOUNT_RAW,
      walletStakeAmountRaw: STAKE_AMOUNT_RAW,
    });
    mockPrepareCalls.mockResolvedValue({
      executionId: 'prepared-stake',
      kind: 'calls.managed',
      review: { fees: { payer: 'sponsor' } },
    });
  });

  it('prepares sponsor-paid exact calls ahead of staking submission', async () => {
    const params: StakeRnbwPreparationParams = {
      accountAddress: ACCOUNT,
      amount: '1',
    };

    await expect(prepareStakeRnbw(params)).resolves.toEqual({
      preparedCalls: {
        executionId: 'prepared-stake',
        kind: 'calls.managed',
        review: { fees: { payer: 'sponsor' } },
      },
      walletStakeAmountRaw: STAKE_AMOUNT_RAW,
    });

    expect(mockResolveStakeClaimStrategy).toHaveBeenCalledWith(STAKE_AMOUNT_RAW);
    expect(mockBuildStakeRnbwExecutionPlan).toHaveBeenCalledWith({
      address: ACCOUNT,
      provider,
      stakeAmountRaw: STAKE_AMOUNT_RAW,
    });
    expect(mockPrepareCalls).toHaveBeenCalledWith({
      account: ACCOUNT,
      calls: [STAKE_CALL],
      chainId: STAKING_CHAIN_ID,
      publicClient: expect.objectContaining({
        chain: expect.objectContaining({ id: STAKING_CHAIN_ID }),
      }),
      requirements: SPONSORED_REQUIREMENTS,
    });
  });

  it('skips preparation when claimable rewards fulfill the stake', async () => {
    mockResolveStakeClaimStrategy.mockResolvedValue({
      claimFulfillsStake: true,
      claimToDestination: 'staking',
      requiredWalletBalanceRaw: '0',
      walletStakeAmountRaw: '0',
    });

    await expect(
      prepareStakeRnbw({
        accountAddress: ACCOUNT,
        amount: '1',
      })
    ).resolves.toBeNull();

    expect(mockBuildStakeRnbwExecutionPlan).not.toHaveBeenCalled();
    expect(mockPrepareCalls).not.toHaveBeenCalled();
  });
});
