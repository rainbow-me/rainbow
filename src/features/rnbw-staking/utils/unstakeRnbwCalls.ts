import { encodeFunctionData, type Address } from 'viem';

import { getRemoteConfig } from '@/features/config/stores/remoteConfig';
import { SPONSORED_CALLS_REQUIREMENTS } from '@/features/delegation/utils/calls';
import { type Call, type CallsRequirements } from '@rainbow-me/delegation';

import { STAKING_ABI, STAKING_CHAIN_ID, STAKING_CONTRACT_ADDRESS } from '../constants';
import { canUseSponsoredRnbwStaking } from './canUseSponsoredRnbwStaking';

// ============ Types ========================================================= //

/** Exact-call sequence plus execution requirements for SDK unstaking execution. */
export type UnstakeRnbwExecutionPlan = {
  calls: Call[];
  requirements?: CallsRequirements;
};

// ============ Calls ========================================================= //

/**
 * Builds the exact unstake call sequence for a full RNBW unstake.
 */
export function buildUnstakeRnbwCalls(): Call[] {
  return [
    {
      to: STAKING_CONTRACT_ADDRESS,
      value: 0n,
      data: encodeFunctionData({ abi: STAKING_ABI, functionName: 'unstakeAll' }),
    },
  ];
}

/**
 * Builds the SDK exact-call plan shared by preparation and software-wallet fallback execution.
 */
export async function buildUnstakeRnbwExecutionPlan({ address }: { address: Address }): Promise<UnstakeRnbwExecutionPlan> {
  const calls = buildUnstakeRnbwCalls();
  const requirements = await resolveUnstakeRnbwCallsRequirements(address);

  return requirements ? { calls, requirements } : { calls };
}

async function resolveUnstakeRnbwCallsRequirements(address: Address): Promise<CallsRequirements | undefined> {
  if (!getRemoteConfig().sponsored_rnbw_unstaking_enabled) return undefined;
  return (await canUseSponsoredRnbwStaking(address, STAKING_CHAIN_ID)) ? SPONSORED_CALLS_REQUIREMENTS : undefined;
}
