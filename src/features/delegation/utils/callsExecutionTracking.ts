import { TransactionStatus, type NewTransaction } from '@/entities/transactions';
import { type ChainId } from '@/features/network/types/backendNetworks';
import { convertNewTransactionToRainbowTransaction } from '@/parsers/transactions';
import { extractReplayableCall } from '@/raps/replay';
import { addNewTransaction, pendingTransactionsActions } from '@/state/pendingTransactions';
import { type ExecuteCallsResult, type ExecutionResult } from '@rainbow-me/delegation';

type ManagedCallsExecution = Extract<ExecuteCallsResult, { kind: 'calls.managed' }>;
type SubmittedCallsExecution = ManagedCallsExecution | ExecutionResult;

/**
 * Registers a submitted SDK exact-call execution with the local pending transaction overlay.
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
  execution: SubmittedCallsExecution;
  transaction: Omit<NewTransaction, 'hash'>;
}): void {
  if ('kind' in execution) {
    trackManagedCallsExecution({ address, batch, execution, transaction });
    return;
  }

  trackWalletCallsExecution({ address, batch, chainId, execution, transaction });
}

function trackManagedCallsExecution({
  address,
  batch,
  execution,
  transaction,
}: {
  address: string;
  batch: boolean;
  execution: ManagedCallsExecution;
  transaction: Omit<NewTransaction, 'hash'>;
}): void {
  pendingTransactionsActions.addPendingTransaction({
    address,
    pendingTransaction: convertNewTransactionToRainbowTransaction({
      ...transaction,
      ...(batch ? { batch: true, delegation: false } : undefined),
      hash: execution.executionId,
      relayExecutionId: execution.executionId,
      status: TransactionStatus.pending,
    }),
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
