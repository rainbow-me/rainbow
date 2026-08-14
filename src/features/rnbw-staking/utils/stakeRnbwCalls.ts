import type { StaticJsonRpcProvider } from '@ethersproject/providers';
import { encodeFunctionData, erc20Abi, type Address } from 'viem';

import { SPONSORED_CALLS_POLICY } from '@/features/delegation/utils/calls';
import { type CallInput, type CallsPlan } from '@rainbow-me/sdk';

import { RNBW_TOKEN_ADDRESS, STAKING_ABI, STAKING_CHAIN_ID, STAKING_CONTRACT_ADDRESS } from '../constants';
import { canUseSponsoredRnbwStaking } from './canUseSponsoredRnbwStaking';
import { checkIfStakingNeedsApproval } from './checkIfStakingNeedsApproval';

// ============ Calls ========================================================= //

/**
 * Builds the exact approval + stake call sequence for a wallet-funded RNBW stake amount.
 */
export async function buildStakeRnbwCalls({
  address,
  provider,
  stakeAmountRaw,
}: {
  address: Address;
  provider: StaticJsonRpcProvider;
  stakeAmountRaw: string;
}): Promise<CallsPlan['calls']> {
  const stakeAmount = BigInt(stakeAmountRaw);
  const needsApproval = await checkIfStakingNeedsApproval({ address, provider, stakeAmountRaw });
  const stakeCall: CallInput = {
    to: STAKING_CONTRACT_ADDRESS,
    value: 0n,
    data: encodeFunctionData({ abi: STAKING_ABI, functionName: 'stake', args: [stakeAmount] }),
  };

  if (!needsApproval) return [stakeCall];

  return [
    {
      to: RNBW_TOKEN_ADDRESS,
      value: 0n,
      data: encodeFunctionData({ abi: erc20Abi, functionName: 'approve', args: [STAKING_CONTRACT_ADDRESS, stakeAmount] }),
    },
    stakeCall,
  ];
}

/**
 * Builds the SDK exact-call plan shared by preparation and software-wallet fallback execution.
 */
export async function buildStakeRnbwExecutionPlan({
  address,
  provider,
  stakeAmountRaw,
}: {
  address: Address;
  provider: StaticJsonRpcProvider;
  stakeAmountRaw: string;
}) {
  const calls = await buildStakeRnbwCalls({ address, provider, stakeAmountRaw });
  return (
    (await canUseSponsoredRnbwStaking(address, STAKING_CHAIN_ID)) ? { ...SPONSORED_CALLS_POLICY, calls } : { calls }
  ) satisfies CallsPlan;
}
