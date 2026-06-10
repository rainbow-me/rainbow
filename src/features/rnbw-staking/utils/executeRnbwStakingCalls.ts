import type { StaticJsonRpcProvider } from '@ethersproject/providers';
import type { Wallet } from '@ethersproject/wallet';
import { type Address } from 'viem';

import { type NewTransaction } from '@/entities/transactions';
import { trackCallsExecution } from '@/features/delegation/callsExecutionTracking';
import { resolveManagedExecutionFailure } from '@/features/delegation/managedExecutionFailure';
import { waitForManagedExecutionConfirmation } from '@/features/delegation/waitForManagedExecution';
import { RainbowError } from '@/logger';
import { execute, type Call, type CallsRequirements, type ExecuteCallsResult, type PreparedCallsExecution } from '@rainbow-me/delegation';

import { STAKING_CHAIN_ID } from '../constants';
import { waitForWalletTransactions } from './waitForWalletTransactions';

// ============ Types ========================================================= //

/** Execution lane used for the wallet-funded or relay-sponsored RNBW staking call. */
export type RnbwStakingExecutionMode = 'manual' | 'sponsored';

/** SDK exact-call plan accepted as a fallback when no prepared calls are available. */
export type RnbwStakingExecutionPlan = {
  calls: Call[];
  requirements?: CallsRequirements;
};

/** Submitted RNBW staking SDK execution plus the confirmation waiter for its lane. */
export type RnbwStakingExecution = {
  executionMode: RnbwStakingExecutionMode;
  executionId?: string;
  txHash?: string;
  waitForConfirmation: () => Promise<void>;
};

type WalletCallsExecution = Extract<ExecuteCallsResult, { kind: 'calls.wallet' }>;

// ============ Execution ===================================================== //

/**
 * Submits an RNBW staking call sequence through the delegation SDK and returns
 * the execution lane plus its confirmation waiter.
 *
 * Shared by stake (approval + stake) and unstake (unstakeAll) execution paths.
 */
export async function executeRnbwStakingCalls({
  address,
  buildPlan,
  errorPrefix,
  preparedCalls,
  provider,
  signer,
  transaction,
}: {
  address: Address;
  buildPlan?: () => Promise<RnbwStakingExecutionPlan>;
  errorPrefix: string;
  preparedCalls: PreparedCallsExecution | null;
  provider: StaticJsonRpcProvider;
  signer: Wallet;
  transaction: Omit<NewTransaction, 'hash'>;
}): Promise<RnbwStakingExecution> {
  const execution = preparedCalls
    ? await execute.calls(preparedCalls, { signer, provider, chainId: STAKING_CHAIN_ID })
    : await execute.calls({ ...(await requireBuildPlan(buildPlan, errorPrefix)()), signer, provider, chainId: STAKING_CHAIN_ID });

  if (execution.kind === 'calls.wallet') {
    const submittedTransaction = requireSubmittedTransaction(execution, errorPrefix);
    const txHashes = execution.transactions.map(item => item.hash);
    trackCallsExecution({
      address,
      batch: false,
      chainId: STAKING_CHAIN_ID,
      execution: submittedTransaction,
      transaction,
    });

    return {
      executionMode: 'manual',
      txHash: submittedTransaction.hash,
      waitForConfirmation: () => waitForWalletTransactions({ provider, txHashes }),
    };
  }

  const failureMessage = await resolveManagedExecutionFailure({
    executionId: execution.executionId,
    status: execution.status,
  });

  if (failureMessage) {
    throw new RainbowError(`${errorPrefix}: ${failureMessage}`);
  }

  trackCallsExecution({
    address,
    batch: false,
    chainId: STAKING_CHAIN_ID,
    execution,
    transaction,
  });

  return {
    executionMode: 'sponsored',
    executionId: execution.executionId,
    waitForConfirmation: () => waitForManagedExecutionConfirmation(execution.executionId),
  };
}

// ============ Local Helpers ================================================= //

function requireSubmittedTransaction(execution: WalletCallsExecution, errorPrefix: string): WalletCallsExecution['transactions'][number] {
  const submittedTransaction = execution.transactions.at(-1);
  if (!submittedTransaction) {
    throw new RainbowError(`${errorPrefix}: wallet execution did not submit a transaction`);
  }
  return submittedTransaction;
}

function requireBuildPlan(
  buildPlan: (() => Promise<RnbwStakingExecutionPlan>) | undefined,
  errorPrefix: string
): () => Promise<RnbwStakingExecutionPlan> {
  if (!buildPlan) {
    throw new RainbowError(`${errorPrefix}: missing exact-call execution plan`);
  }
  return buildPlan;
}
