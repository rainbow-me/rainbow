import { encodeFunctionData, type Address } from 'viem';

import { withRemoteConfig } from '@/features/config/testing/mockRemoteConfig';
import { type CallInput, type CallsPolicy } from '@rainbow-me/sdk';

import { STAKING_ABI, STAKING_CHAIN_ID, STAKING_CONTRACT_ADDRESS } from '../constants';
import { buildUnstakeRnbwCalls, buildUnstakeRnbwExecutionPlan } from './unstakeRnbwCalls';

const mockCanUseSponsoredRnbwStaking = jest.fn<Promise<boolean>, [Address, number]>();

jest.mock('./canUseSponsoredRnbwStaking', () => ({
  canUseSponsoredRnbwStaking: (address: Address, chainId: number) => mockCanUseSponsoredRnbwStaking(address, chainId),
}));

jest.mock('@/features/config/stores/remoteConfig');

jest.mock('@/utils/ethereumUtils', () => ({
  getUniqueId: (address: string, chainId: number) => `${address}_${chainId}`,
}));

const ACCOUNT = '0x3333333333333333333333333333333333333333' satisfies Address;
const SPONSORED_POLICY = { atomic: true, sponsorship: 'required' } satisfies CallsPolicy;

function buildUnstakeCall(): CallInput {
  return {
    data: encodeFunctionData({ abi: STAKING_ABI, functionName: 'unstakeAll' }),
    to: STAKING_CONTRACT_ADDRESS,
    value: 0n,
  };
}

describe('unstakeRnbwCalls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCanUseSponsoredRnbwStaking.mockResolvedValue(false);
  });

  it('builds a single unstakeAll call', () => {
    expect(buildUnstakeRnbwCalls()).toEqual([buildUnstakeCall()]);
  });

  it('adds sponsor-paid policy when unstaking can use sponsored execution and flag is on', async () => {
    mockCanUseSponsoredRnbwStaking.mockResolvedValue(true);

    await withRemoteConfig({ sponsored_rnbw_unstaking_enabled: true }, async () => {
      await expect(buildUnstakeRnbwExecutionPlan({ address: ACCOUNT })).resolves.toEqual({
        calls: [buildUnstakeCall()],
        ...SPONSORED_POLICY,
      });
    });

    expect(mockCanUseSponsoredRnbwStaking).toHaveBeenCalledWith(ACCOUNT, STAKING_CHAIN_ID);
  });

  it('omits sponsorship policy when sponsorship is unavailable', async () => {
    await withRemoteConfig({ sponsored_rnbw_unstaking_enabled: true }, async () => {
      await expect(buildUnstakeRnbwExecutionPlan({ address: ACCOUNT })).resolves.toEqual({
        calls: [buildUnstakeCall()],
      });
    });

    expect(mockCanUseSponsoredRnbwStaking).toHaveBeenCalledWith(ACCOUNT, STAKING_CHAIN_ID);
  });

  it('omits sponsorship policy when the feature flag is off, even if sponsored execution is available', async () => {
    mockCanUseSponsoredRnbwStaking.mockResolvedValue(true);

    await withRemoteConfig({ sponsored_rnbw_unstaking_enabled: false }, async () => {
      await expect(buildUnstakeRnbwExecutionPlan({ address: ACCOUNT })).resolves.toEqual({
        calls: [buildUnstakeCall()],
      });
    });

    expect(mockCanUseSponsoredRnbwStaking).not.toHaveBeenCalled();
  });
});
