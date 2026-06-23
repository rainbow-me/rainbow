import { encodeFunctionData, type Address } from 'viem';

import { type Call, type CallsRequirements } from '@rainbow-me/delegation';

import { STAKING_ABI, STAKING_CHAIN_ID, STAKING_CONTRACT_ADDRESS } from '../constants';
import { buildUnstakeRnbwCalls, buildUnstakeRnbwExecutionPlan } from './unstakeRnbwCalls';

const mockCanUseSponsoredRnbwStaking = jest.fn<Promise<boolean>, [Address, number]>();
const mockGetRemoteConfig = jest.fn<{ sponsored_rnbw_unstaking_enabled: boolean }, []>();

jest.mock('./canUseSponsoredRnbwStaking', () => ({
  canUseSponsoredRnbwStaking: (address: Address, chainId: number) => mockCanUseSponsoredRnbwStaking(address, chainId),
}));

jest.mock('@/features/config/stores/remoteConfig', () => ({
  getRemoteConfig: () => mockGetRemoteConfig(),
}));

jest.mock('@/utils/ethereumUtils', () => ({
  getUniqueId: (address: string, chainId: number) => `${address}_${chainId}`,
}));

const ACCOUNT = '0x3333333333333333333333333333333333333333' satisfies Address;
const SPONSORED_REQUIREMENTS = { atomic: 'required', fees: { payer: 'sponsor' } } satisfies CallsRequirements;

function buildUnstakeCall(): Call {
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
    mockGetRemoteConfig.mockReturnValue({ sponsored_rnbw_unstaking_enabled: true });
  });

  it('builds a single unstakeAll call', () => {
    expect(buildUnstakeRnbwCalls()).toEqual([buildUnstakeCall()]);
  });

  it('adds sponsor-paid requirements when unstaking can use sponsored execution and flag is on', async () => {
    mockCanUseSponsoredRnbwStaking.mockResolvedValue(true);

    await expect(buildUnstakeRnbwExecutionPlan({ address: ACCOUNT })).resolves.toEqual({
      calls: [buildUnstakeCall()],
      requirements: SPONSORED_REQUIREMENTS,
    });

    expect(mockCanUseSponsoredRnbwStaking).toHaveBeenCalledWith(ACCOUNT, STAKING_CHAIN_ID);
  });

  it('omits requirements when sponsorship is unavailable', async () => {
    await expect(buildUnstakeRnbwExecutionPlan({ address: ACCOUNT })).resolves.toEqual({
      calls: [buildUnstakeCall()],
    });
  });

  it('omits requirements when the feature flag is off, even if sponsored execution is available', async () => {
    mockCanUseSponsoredRnbwStaking.mockResolvedValue(true);
    mockGetRemoteConfig.mockReturnValue({ sponsored_rnbw_unstaking_enabled: false });

    await expect(buildUnstakeRnbwExecutionPlan({ address: ACCOUNT })).resolves.toEqual({
      calls: [buildUnstakeCall()],
    });

    expect(mockCanUseSponsoredRnbwStaking).not.toHaveBeenCalled();
  });
});
