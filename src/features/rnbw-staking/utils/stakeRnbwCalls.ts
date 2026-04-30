import type { StaticJsonRpcProvider } from '@ethersproject/providers';
import { encodeFunctionData, erc20Abi, type Address } from 'viem';

import { SPONSORED_CALLS_REQUIREMENTS } from '@/features/delegation/calls';
import { type Call, type CallsRequirements } from '@rainbow-me/delegation';

import { RNBW_TOKEN_ADDRESS, STAKING_ABI, STAKING_CHAIN_ID, STAKING_CONTRACT_ADDRESS } from '../constants';
import { canUseSponsoredRnbwStaking } from './canUseSponsoredRnbwStaking';
import { checkIfStakingNeedsApproval } from './checkIfStakingNeedsApproval';

// ============ Types ========================================================= //

/** Exact-call sequence plus execution requirements for SDK staking execution. */
export type StakeRnbwExecutionPlan = {
  calls: Call[];
  requirements?: CallsRequirements;
};

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
}): Promise<Call[]> {
  const stakeAmount = BigInt(stakeAmountRaw);
  const calls: Call[] = [];

  const needsApproval = await checkIfStakingNeedsApproval({ address, provider, stakeAmountRaw });
  if (needsApproval) {
    calls.push({
      to: RNBW_TOKEN_ADDRESS,
      value: 0n,
      data: encodeFunctionData({ abi: erc20Abi, functionName: 'approve', args: [STAKING_CONTRACT_ADDRESS, stakeAmount] }),
    });
  }

  calls.push({
    to: STAKING_CONTRACT_ADDRESS,
    value: 0n,
    data: encodeFunctionData({ abi: STAKING_ABI, functionName: 'stake', args: [stakeAmount] }),
  });

  return calls;
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
}): Promise<StakeRnbwExecutionPlan> {
  const calls = await buildStakeRnbwCalls({ address, provider, stakeAmountRaw });
  const requirements = await resolveStakeRnbwCallsRequirements(address);

  return requirements ? { calls, requirements } : { calls };
}

async function resolveStakeRnbwCallsRequirements(address: Address): Promise<CallsRequirements | undefined> {
  return (await canUseSponsoredRnbwStaking(address, STAKING_CHAIN_ID)) ? SPONSORED_CALLS_REQUIREMENTS : undefined;
}
