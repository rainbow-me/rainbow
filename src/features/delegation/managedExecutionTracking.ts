import { TransactionStatus, type NewTransaction, type RainbowTransaction } from '@/entities/transactions';
import { pendingTransactionsActions } from '@/state/pendingTransactions';

type ManagedExecutionTransaction = Omit<NewTransaction, 'hash'> & {
  relayExecutionId: string;
};

export function trackManagedCallsExecution({
  address,
  executionId,
  transaction,
}: {
  address: string;
  executionId: string;
  transaction: Omit<NewTransaction, 'hash'>;
}): void {
  const trackedTransaction = bindManagedExecution(transaction, executionId);

  pendingTransactionsActions.addPendingTransaction({
    address,
    pendingTransaction: buildManagedExecutionPendingTransaction(trackedTransaction),
  });
}

function bindManagedExecution(transaction: Omit<NewTransaction, 'hash'>, executionId: string): ManagedExecutionTransaction {
  return {
    ...transaction,
    relayExecutionId: executionId,
  };
}

function buildManagedExecutionPendingTransaction(transaction: ManagedExecutionTransaction): RainbowTransaction {
  const asset = transaction.changes?.[0]?.asset || transaction.asset;

  return {
    ...transaction,
    asset,
    description: asset?.name,
    hash: transaction.relayExecutionId,
    relayExecutionId: transaction.relayExecutionId,
    status: TransactionStatus.pending,
    timestamp: Date.now(),
    title: `${transaction.type}.${TransactionStatus.pending}`,
  };
}
