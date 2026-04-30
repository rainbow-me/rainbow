import { parseUnits, type Address } from 'viem';

import { createDelegationPublicClient } from '@/features/delegation/calls';
import { canUseDelegatedExecution } from '@/features/delegation/willDelegate';
import { isPositive } from '@/framework/core/safeMath';
import { getProvider } from '@/handlers/web3';
import { execute, type PreparedCallsExecution } from '@rainbow-me/delegation';

import { RNBW_DECIMALS, STAKING_CHAIN_ID } from '../constants';
import { resolveStakeClaimStrategy } from './resolveStakeClaimStrategy';
import { buildStakeRnbwExecutionPlan } from './stakeRnbwCalls';

// ============ Types ========================================================= //

/** Query identity for staking exact-call preparation. */
export type StakeRnbwPreparationParams = {
  accountAddress: Address;
  amount: string;
};

/** Prepared staking execution for the wallet-funded portion of a stake. */
export type PreparedStakeRnbw = {
  preparedCalls: PreparedCallsExecution;
  walletStakeAmountRaw: string;
};

// ============ Preparation =================================================== //

/**
 * Prepares staking calls for the current deposit input.
 */
export async function prepareStakeRnbw({ accountAddress, amount }: StakeRnbwPreparationParams): Promise<PreparedStakeRnbw | null> {
  const stakeAmountRaw = parseUnits(amount, RNBW_DECIMALS).toString();
  if (!canUseDelegatedExecution(accountAddress)) return null;

  const { claimFulfillsStake, walletStakeAmountRaw } = await resolveStakeClaimStrategy(stakeAmountRaw);

  if (claimFulfillsStake || !isPositive(walletStakeAmountRaw)) return null;

  const plan = await buildStakeRnbwExecutionPlan({
    address: accountAddress,
    provider: getProvider({ chainId: STAKING_CHAIN_ID }),
    stakeAmountRaw: walletStakeAmountRaw,
  });

  const preparedCalls = await execute.prepare.calls({
    ...plan,
    account: accountAddress,
    chainId: STAKING_CHAIN_ID,
    publicClient: createDelegationPublicClient(STAKING_CHAIN_ID),
  });

  return {
    preparedCalls,
    walletStakeAmountRaw,
  };
}
