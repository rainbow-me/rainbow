import { encodeFunctionData, type Address } from 'viem';

import { getRemoteConfig } from '@/features/config/stores/remoteConfig';
import { SPONSORED_CALLS_POLICY } from '@/features/delegation/utils/calls';
import { type CallsPlan } from '@rainbow-me/sdk';

import { STAKING_ABI, STAKING_CHAIN_ID, STAKING_CONTRACT_ADDRESS } from '../constants';
import { canUseSponsoredRnbwStaking } from './canUseSponsoredRnbwStaking';

// ============ Calls ========================================================= //

/**
 * Builds the exact unstake call sequence for a full RNBW unstake.
 */
export function buildUnstakeRnbwCalls(): CallsPlan['calls'] {
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
export async function buildUnstakeRnbwExecutionPlan({ address }: { address: Address }) {
  const calls = buildUnstakeRnbwCalls();
  if (!getRemoteConfig().sponsored_rnbw_unstaking_enabled) return { calls } satisfies CallsPlan;
  return (
    (await canUseSponsoredRnbwStaking(address, STAKING_CHAIN_ID)) ? { ...SPONSORED_CALLS_POLICY, calls } : { calls }
  ) satisfies CallsPlan;
}
