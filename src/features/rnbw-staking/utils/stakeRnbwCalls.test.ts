import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { encodeFunctionData, erc20Abi, type Address } from 'viem';

import { type CallInput, type CallsPolicy } from '@rainbow-me/sdk';

import { RNBW_TOKEN_ADDRESS, STAKING_ABI, STAKING_CHAIN_ID, STAKING_CONTRACT_ADDRESS } from '../constants';
import { buildStakeRnbwCalls, buildStakeRnbwExecutionPlan } from './stakeRnbwCalls';

const mockCanUseSponsoredRnbwStaking = jest.fn<Promise<boolean>, [Address, number]>();
const mockCheckIfStakingNeedsApproval = jest.fn<Promise<boolean>, [unknown]>();

jest.mock('./canUseSponsoredRnbwStaking', () => ({
  canUseSponsoredRnbwStaking: (address: Address, chainId: number) => mockCanUseSponsoredRnbwStaking(address, chainId),
}));

jest.mock('./checkIfStakingNeedsApproval', () => ({
  checkIfStakingNeedsApproval: (params: unknown) => mockCheckIfStakingNeedsApproval(params),
}));

jest.mock('@/utils/ethereumUtils', () => ({
  getUniqueId: (address: string, chainId: number) => `${address}_${chainId}`,
}));

const ACCOUNT = '0x3333333333333333333333333333333333333333' satisfies Address;
const STAKE_AMOUNT_RAW = '1000000000000000000';
const provider = new StaticJsonRpcProvider('http://127.0.0.1:8545', STAKING_CHAIN_ID);
const SPONSORED_POLICY = { atomic: true, sponsorship: 'required' } satisfies CallsPolicy;

function buildApprovalCall(): CallInput {
  return {
    data: encodeFunctionData({
      abi: erc20Abi,
      args: [STAKING_CONTRACT_ADDRESS, BigInt(STAKE_AMOUNT_RAW)],
      functionName: 'approve',
    }),
    to: RNBW_TOKEN_ADDRESS,
    value: 0n,
  };
}

function buildStakeCall(): CallInput {
  return {
    data: encodeFunctionData({
      abi: STAKING_ABI,
      args: [BigInt(STAKE_AMOUNT_RAW)],
      functionName: 'stake',
    }),
    to: STAKING_CONTRACT_ADDRESS,
    value: 0n,
  };
}

describe('stakeRnbwCalls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCanUseSponsoredRnbwStaking.mockResolvedValue(false);
    mockCheckIfStakingNeedsApproval.mockResolvedValue(false);
  });

  it('builds approval before stake when allowance is insufficient', async () => {
    mockCheckIfStakingNeedsApproval.mockResolvedValue(true);

    await expect(buildStakeRnbwCalls({ address: ACCOUNT, provider, stakeAmountRaw: STAKE_AMOUNT_RAW })).resolves.toEqual([
      buildApprovalCall(),
      buildStakeCall(),
    ]);

    expect(mockCheckIfStakingNeedsApproval).toHaveBeenCalledWith({
      address: ACCOUNT,
      provider,
      stakeAmountRaw: STAKE_AMOUNT_RAW,
    });
  });

  it('omits approval when allowance covers the stake', async () => {
    await expect(buildStakeRnbwCalls({ address: ACCOUNT, provider, stakeAmountRaw: STAKE_AMOUNT_RAW })).resolves.toEqual([
      buildStakeCall(),
    ]);
  });

  it('adds sponsor-paid policy when staking can use sponsored execution', async () => {
    mockCanUseSponsoredRnbwStaking.mockResolvedValue(true);

    await expect(buildStakeRnbwExecutionPlan({ address: ACCOUNT, provider, stakeAmountRaw: STAKE_AMOUNT_RAW })).resolves.toEqual({
      calls: [buildStakeCall()],
      ...SPONSORED_POLICY,
    });

    expect(mockCanUseSponsoredRnbwStaking).toHaveBeenCalledWith(ACCOUNT, STAKING_CHAIN_ID);
  });

  it('omits sponsorship policy when sponsorship is unavailable', async () => {
    await expect(buildStakeRnbwExecutionPlan({ address: ACCOUNT, provider, stakeAmountRaw: STAKE_AMOUNT_RAW })).resolves.toEqual({
      calls: [buildStakeCall()],
    });
  });
});
