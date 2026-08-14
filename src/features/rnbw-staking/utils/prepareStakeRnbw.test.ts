import { type Address } from 'viem';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { type CallInput, type CallsPlan, type CallsPolicy } from '@rainbow-me/sdk';

import { STAKING_CHAIN_ID, STAKING_CONTRACT_ADDRESS } from '../constants';
import { prepareStakeRnbw, type StakeRnbwPreparationParams } from './prepareStakeRnbw';

const mockCanUseDelegatedExecution = vi.fn<(...args: [Address]) => boolean>();
const mockPrepareCalls = vi.fn<(...args: [unknown]) => Promise<unknown>>();
const mockBuildStakeRnbwExecutionPlan = vi.fn<(...args: [unknown]) => Promise<CallsPlan>>();
const mockGetProvider = vi.fn();
const mockResolveStakeClaimStrategy = vi.fn<(...args: [string]) => Promise<unknown>>();

vi.mock('@rainbow-me/sdk', () => ({
  execute: {
    prepare: {
      calls: (params: unknown) => mockPrepareCalls(params),
    },
  },
}));

vi.mock('@/handlers/web3', () => ({
  getProvider: () => mockGetProvider(),
}));

vi.mock('@/features/delegation/utils/willDelegate', () => ({
  canUseDelegatedExecution: (address: Address) => mockCanUseDelegatedExecution(address),
}));

vi.mock('@/features/network/stores/backendNetworksStore', () => ({
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

vi.mock('@/utils/ethereumUtils', () => ({
  getUniqueId: (address: string, chainId: number) => `${address}_${chainId}`,
}));

vi.mock('./resolveStakeClaimStrategy', () => ({
  resolveStakeClaimStrategy: (stakeAmountRaw: string) => mockResolveStakeClaimStrategy(stakeAmountRaw),
}));

vi.mock('./stakeRnbwCalls', () => ({
  buildStakeRnbwExecutionPlan: (params: unknown) => mockBuildStakeRnbwExecutionPlan(params),
}));

const ACCOUNT = '0x3333333333333333333333333333333333333333' satisfies Address;
const STAKE_AMOUNT_RAW = '1000000000000000000';
const provider = { name: 'provider' };
const STAKE_CALL: CallInput = { data: '0x1234', to: STAKING_CONTRACT_ADDRESS, value: 0n };
const SPONSORED_POLICY = { atomic: true, sponsorship: 'required' } satisfies CallsPolicy;

describe('prepareStakeRnbw', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCanUseDelegatedExecution.mockReturnValue(true);
    mockGetProvider.mockReturnValue(provider);
    mockBuildStakeRnbwExecutionPlan.mockResolvedValue({ calls: [STAKE_CALL], ...SPONSORED_POLICY });
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
      ...SPONSORED_POLICY,
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

  it('skips preparation when delegated execution is unavailable', async () => {
    mockCanUseDelegatedExecution.mockReturnValue(false);

    await expect(
      prepareStakeRnbw({
        accountAddress: ACCOUNT,
        amount: '1',
      })
    ).resolves.toBeNull();

    expect(mockResolveStakeClaimStrategy).not.toHaveBeenCalled();
    expect(mockBuildStakeRnbwExecutionPlan).not.toHaveBeenCalled();
    expect(mockPrepareCalls).not.toHaveBeenCalled();
  });
});
