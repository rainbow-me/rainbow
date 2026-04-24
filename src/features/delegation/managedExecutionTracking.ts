import { TransactionStatus, type NewTransaction } from '@/entities/transactions';
import { convertNewTransactionToRainbowTransaction } from '@/parsers/transactions';
import { pendingTransactionsActions } from '@/state/pendingTransactions';

/**
 * Registers a managed execution immediately under its relay execution id so the
 * local overlay exists before the relay exposes real onchain hashes.
 */
export function trackManagedExecution({
  address,
  executionId,
  transaction,
}: {
  address: string;
  executionId: string;
  transaction: Omit<NewTransaction, 'hash'>;
}): void {
  pendingTransactionsActions.addPendingTransaction({
    address,
    pendingTransaction: convertNewTransactionToRainbowTransaction({
      ...transaction,
      hash: executionId,
      relayExecutionId: executionId,
      status: TransactionStatus.pending,
    }),
  });
}
