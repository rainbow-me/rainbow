import { buildTransactionTitle, TransactionStatus, type NewTransaction } from '@/entities/transactions';
import { convertNewTransactionToRainbowTransaction } from '@/parsers/transactions';
import { extractReplayableCall } from '@/raps/replay';
import { type ChainId } from '@/state/backendNetworks/types';
import { addNewTransaction, pendingTransactionsActions } from '@/state/pendingTransactions';
import { type ExecuteCallsResult, type ExecutionResult } from '@rainbow-me/delegation';

import { resolveManagedExecutionFailure } from './managedExecutionFailure';

type ManagedCallsExecution = Extract<ExecuteCallsResult, { kind: 'calls.managed' }>;

/**
 * Registers a submitted wallet-owned SDK exact-call execution with the local pending transaction overlay.
 */
export function trackCallsExecution({
  address,
  batch,
  chainId,
  execution,
  transaction,
}: {
  address: string;
  batch: boolean;
  chainId: ChainId;
  execution: ExecutionResult;
  transaction: Omit<NewTransaction, 'hash'>;
}): void {
  trackWalletCallsExecution({ address, batch, chainId, execution, transaction });
}

/**
 * Records a managed relay execution in the local overlay and returns the
 * terminal failure message, when the relay rejected it before onchain indexing.
 */
export async function trackManagedCallsExecutionResult({
  address,
  batch,
  execution,
  transaction,
}: {
  address: string;
  batch: boolean;
  execution: ManagedCallsExecution;
  transaction: Omit<NewTransaction, 'hash'>;
}): Promise<string | null> {
  const failureMessage = await resolveManagedExecutionFailure({
    executionId: execution.executionId,
    status: execution.status,
  });

  addManagedCallsTransaction({
    address,
    batch,
    execution,
    status: failureMessage ? TransactionStatus.failed : TransactionStatus.pending,
    transaction,
  });

  return failureMessage;
}

function addManagedCallsTransaction({
  address,
  batch,
  execution,
  status,
  transaction,
}: {
  address: string;
  batch: boolean;
  execution: ManagedCallsExecution;
  status: TransactionStatus.failed | TransactionStatus.pending;
  transaction: Omit<NewTransaction, 'hash'>;
}): void {
  const parsedTransaction = convertNewTransactionToRainbowTransaction({
    ...transaction,
    ...(batch ? { batch: true, delegation: false } : undefined),
    hash: execution.executionId,
    relayExecutionId: execution.executionId,
  });

  pendingTransactionsActions.addPendingTransaction({
    address,
    pendingTransaction: {
      ...parsedTransaction,
      status,
      title: buildTransactionTitle(parsedTransaction.type, status),
    },
  });
}

function trackWalletCallsExecution({
  address,
  batch,
  chainId,
  execution,
  transaction,
}: {
  address: string;
  batch: boolean;
  chainId: ChainId;
  execution: ExecutionResult;
  transaction: Omit<NewTransaction, 'hash'>;
}): void {
  const executionTransaction = execution.transaction;
  const isBatchedExecution = batch || execution.type === 'eip7702';
  const executionMetadata = isBatchedExecution
    ? {
        batch: true,
        delegation: execution.type === 'eip7702',
      }
    : undefined;

  addNewTransaction({
    address,
    chainId,
    transaction: {
      ...transaction,
      ...extractReplayableCall(executionTransaction, transaction),
      ...executionMetadata,
      hash: execution.hash,
      gasPrice: undefined,
      gasLimit: executionTransaction.gas.toString(),
      maxFeePerGas: executionTransaction.maxFeePerGas,
      maxPriorityFeePerGas: executionTransaction.maxPriorityFeePerGas,
      nonce: executionTransaction.nonce,
    },
  });
}
