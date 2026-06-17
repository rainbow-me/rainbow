import { type Address } from 'viem';

import { type Call, type CallsRequirements } from '@rainbow-me/delegation';

import { STAKING_CHAIN_ID, STAKING_CONTRACT_ADDRESS } from '../constants';
import { prepareUnstakeRnbw } from './prepareUnstakeRnbw';

const mockCanUseDelegatedExecution = jest.fn<boolean, [Address]>();
const mockPrepareCalls = jest.fn<Promise<unknown>, [unknown]>();
const mockBuildUnstakeRnbwExecutionPlan = jest.fn<Promise<{ calls: Call[]; requirements?: CallsRequirements }>, [unknown]>();

jest.mock('@rainbow-me/delegation', () => ({
  execute: {
    prepare: {
      calls: (params: unknown) => mockPrepareCalls(params),
    },
  },
}));

jest.mock('@/features/delegation/willDelegate', () => ({
  canUseDelegatedExecution: (address: Address) => mockCanUseDelegatedExecution(address),
}));

jest.mock('@/features/network/stores/backendNetworksStore', () => ({
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

jest.mock('./unstakeRnbwCalls', () => ({
  buildUnstakeRnbwExecutionPlan: (params: unknown) => mockBuildUnstakeRnbwExecutionPlan(params),
}));

const ACCOUNT = '0x3333333333333333333333333333333333333333' satisfies Address;
const UNSTAKE_CALL = { data: '0x1234', to: STAKING_CONTRACT_ADDRESS, value: 0n } satisfies Call;
const SPONSORED_REQUIREMENTS = { atomic: 'required', fees: { payer: 'sponsor' } } satisfies CallsRequirements;

describe('prepareUnstakeRnbw', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCanUseDelegatedExecution.mockReturnValue(true);
    mockBuildUnstakeRnbwExecutionPlan.mockResolvedValue({ calls: [UNSTAKE_CALL], requirements: SPONSORED_REQUIREMENTS });
    mockPrepareCalls.mockResolvedValue({
      executionId: 'prepared-unstake',
      kind: 'calls.managed',
      review: { fees: { payer: 'sponsor' } },
    });
  });

  it('prepares sponsor-paid exact calls ahead of unstaking submission', async () => {
    await expect(prepareUnstakeRnbw({ accountAddress: ACCOUNT })).resolves.toEqual({
      preparedCalls: {
        executionId: 'prepared-unstake',
        kind: 'calls.managed',
        review: { fees: { payer: 'sponsor' } },
      },
    });

    expect(mockBuildUnstakeRnbwExecutionPlan).toHaveBeenCalledWith({ address: ACCOUNT });
    expect(mockPrepareCalls).toHaveBeenCalledWith({
      account: ACCOUNT,
      calls: [UNSTAKE_CALL],
      chainId: STAKING_CHAIN_ID,
      publicClient: expect.objectContaining({
        chain: expect.objectContaining({ id: STAKING_CHAIN_ID }),
      }),
      requirements: SPONSORED_REQUIREMENTS,
    });
  });

  it('skips preparation when delegated execution is unavailable', async () => {
    mockCanUseDelegatedExecution.mockReturnValue(false);

    await expect(prepareUnstakeRnbw({ accountAddress: ACCOUNT })).resolves.toBeNull();

    expect(mockBuildUnstakeRnbwExecutionPlan).not.toHaveBeenCalled();
    expect(mockPrepareCalls).not.toHaveBeenCalled();
  });

  it('skips preparation when unstake sponsorship is unavailable', async () => {
    mockBuildUnstakeRnbwExecutionPlan.mockResolvedValue({ calls: [UNSTAKE_CALL] });

    await expect(prepareUnstakeRnbw({ accountAddress: ACCOUNT })).resolves.toBeNull();

    expect(mockBuildUnstakeRnbwExecutionPlan).toHaveBeenCalledWith({ address: ACCOUNT });
    expect(mockPrepareCalls).not.toHaveBeenCalled();
  });

  it('skips preparation when the SDK does not return sponsor-paid calls', async () => {
    mockPrepareCalls.mockResolvedValue({
      kind: 'calls.wallet',
      review: {
        requiresDelegationAuthorization: false,
        transactions: [],
      },
    });

    await expect(prepareUnstakeRnbw({ accountAddress: ACCOUNT })).resolves.toBeNull();
  });
});
