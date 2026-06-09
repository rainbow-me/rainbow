import { type Address } from 'viem';

import { createDelegationPublicClient, isPreparedCallsExecutionSponsored } from '@/features/delegation/calls';
import { canUseDelegatedExecution } from '@/features/delegation/willDelegate';
import { execute, type PreparedCallsExecution } from '@rainbow-me/delegation';

import { STAKING_CHAIN_ID } from '../constants';
import { buildUnstakeRnbwExecutionPlan } from './unstakeRnbwCalls';

// ============ Types ========================================================= //

/** Query identity for unstaking exact-call preparation. */
export type UnstakeRnbwPreparationParams = {
  accountAddress: Address;
};

/** Prepared unstaking execution for the wallet-funded portion of an unstake. */
export type PreparedUnstakeRnbw = {
  preparedCalls: PreparedCallsExecution;
};

// ============ Preparation =================================================== //

/**
 * Prepares unstaking calls ahead of submission.
 */
export async function prepareUnstakeRnbw({ accountAddress }: UnstakeRnbwPreparationParams): Promise<PreparedUnstakeRnbw | null> {
  if (!canUseDelegatedExecution(accountAddress)) return null;

  const plan = await buildUnstakeRnbwExecutionPlan({ address: accountAddress });
  if (!plan.requirements) return null;

  const preparedCalls = await execute.prepare.calls({
    ...plan,
    account: accountAddress,
    chainId: STAKING_CHAIN_ID,
    publicClient: createDelegationPublicClient(STAKING_CHAIN_ID),
  });

  if (!isPreparedCallsExecutionSponsored(preparedCalls)) return null;

  return { preparedCalls };
}
