import { type Address } from 'viem';

import { createDelegationPublicClient } from '@/features/delegation/utils/calls';
import { canUseDelegatedExecution } from '@/features/delegation/utils/willDelegate';
import { execute, type PreparedCallsExecution } from '@rainbow-me/sdk';

import { STAKING_CHAIN_ID } from '../constants';
import { buildUnstakeRnbwExecutionPlan } from './unstakeRnbwCalls';

// ============ Types ========================================================= //

/** Query identity for unstaking exact-call preparation. */
export type UnstakeRnbwPreparationParams = {
  accountAddress: Address;
};

/** Sponsor-paid unstaking execution prepared for submission. */
export type PreparedUnstakeRnbw = {
  preparedCalls: PreparedCallsExecution<'calls.managed'>;
};

// ============ Preparation =================================================== //

/**
 * Prepares unstaking calls ahead of submission.
 */
export async function prepareUnstakeRnbw({ accountAddress }: UnstakeRnbwPreparationParams): Promise<PreparedUnstakeRnbw | null> {
  if (!canUseDelegatedExecution(accountAddress)) return null;

  const plan = await buildUnstakeRnbwExecutionPlan({ address: accountAddress });
  if (!('sponsorship' in plan)) return null;

  const preparedCalls = await execute.prepare.calls({
    ...plan,
    account: accountAddress,
    chainId: STAKING_CHAIN_ID,
    publicClient: createDelegationPublicClient(STAKING_CHAIN_ID),
  });

  return { preparedCalls };
}
