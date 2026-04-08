import { RelayExecutionStatus, type RelayStatusSnapshot } from '@rainbow-me/delegation';
import {
  type MinedTransaction,
  type PendingTransaction,
  type RainbowTransaction,
  TransactionStatus,
  buildTransactionTitle,
  isValidTransactionStatus,
} from '@/entities/transactions';
import { relayService } from '@/features/delegation/relayService';
import { RainbowError, logger } from '@/logger';
import type { SupportedCurrencyKey } from '@/references/supportedCurrencies';
import { fetchRawTransaction } from '@/resources/transactions/transaction';

type SettledTransaction = RainbowTransaction & {
  status: TransactionStatus.confirmed | TransactionStatus.failed;
};

type PendingTransactionResolution =
  | { kind: 'pending'; transaction: PendingTransaction }
  | { kind: 'settled'; transaction: SettledTransaction };

/**
 * Checks a pending transaction and returns whether it is still pending or has
 * settled.
 *
 * Wallet-owned transactions settle by transaction hash. Managed relay
 * transactions settle by relay status, and use the origin hash only while the
 * relay is still reporting a nonterminal state.
 */
export async function resolvePendingTransaction({
  abortController,
  address,
  currency,
  transaction,
}: {
  abortController: AbortController | null;
  address: string;
  currency: SupportedCurrencyKey;
  transaction: RainbowTransaction;
}): Promise<PendingTransactionResolution> {
  if (transaction.relayExecutionId) {
    return resolveManagedPendingTransaction({
      abortController,
      address,
      currency,
      transaction,
    });
  }

  return resolveOnchainPendingTransaction({
    abortController,
    address,
    currency,
    transaction,
  });
}

async function fetchTransaction({
  abortController,
  address,
  currency,
  transaction,
}: {
  abortController: AbortController | null;
  address: string;
  currency: SupportedCurrencyKey;
  transaction: RainbowTransaction;
}): Promise<PendingTransaction | SettledTransaction> {
  try {
    if (!transaction.chainId || !transaction.hash) {
      throw new Error('Pending transaction missing chainId or hash');
    }

    const fetchedTransaction = await fetchRawTransaction({
      abortController,
      address,
      chainId: transaction.chainId,
      currency,
      hash: transaction.hash,
      originalType: transaction.type,
    });

    return applyTransactionUpdates(transaction, fetchedTransaction);
  } catch (e) {
    logger.error(new RainbowError('[fetchTransaction]: Failed to fetch transaction', e), {
      transaction,
    });
    return toPendingTransaction(transaction);
  }
}

async function resolveOnchainPendingTransaction({
  abortController,
  address,
  currency,
  transaction,
}: {
  abortController: AbortController | null;
  address: string;
  currency: SupportedCurrencyKey;
  transaction: RainbowTransaction;
}): Promise<PendingTransactionResolution> {
  const nextTransaction = await fetchTransaction({
    abortController,
    address,
    currency,
    transaction,
  });

  if (nextTransaction.status === TransactionStatus.pending) {
    return {
      kind: 'pending',
      transaction: nextTransaction,
    };
  }

  return {
    kind: 'settled',
    transaction: nextTransaction,
  };
}

async function resolveManagedPendingTransaction({
  abortController,
  address,
  currency,
  transaction,
}: {
  abortController: AbortController | null;
  address: string;
  currency: SupportedCurrencyKey;
  transaction: RainbowTransaction;
}): Promise<PendingTransactionResolution> {
  try {
    const executionId = transaction.relayExecutionId;
    if (!executionId) return { kind: 'pending', transaction: toPendingTransaction(transaction) };

    const update = await relayService.getStatus(executionId);
    const trackedTransaction = bindManagedOriginTxHash(transaction, readOriginTxHash(update.status));
    const hasOriginTxHash = trackedTransaction.hash !== executionId;

    switch (update.status.status) {
      case RelayExecutionStatus.Confirmed:
        if (!hasOriginTxHash) {
          logger.warn('[resolvePendingTransaction]: managed relay execution finished without onchain transaction evidence', {
            executionId,
            status: update.status.status,
          });
        }

        return {
          kind: 'settled',
          transaction: buildSettledTransaction(trackedTransaction, TransactionStatus.confirmed),
        };

      case RelayExecutionStatus.Failed:
      case RelayExecutionStatus.Reverted:
        return {
          kind: 'settled',
          transaction: buildSettledTransaction(trackedTransaction, TransactionStatus.failed),
        };

      default:
        if (!hasOriginTxHash) {
          return { kind: 'pending', transaction: toPendingTransaction(trackedTransaction) };
        }

        return resolveOnchainPendingTransaction({
          abortController,
          address,
          currency,
          transaction: trackedTransaction,
        });
    }
  } catch (e) {
    logger.error(new RainbowError('[resolvePendingTransaction]: Failed to fetch managed relay execution status', e), {
      executionId: transaction.relayExecutionId,
    });
    return { kind: 'pending', transaction: toPendingTransaction(transaction) };
  }
}

function applyTransactionUpdates(
  original: RainbowTransaction,
  fetched: RainbowTransaction | null
): PendingTransaction | SettledTransaction {
  if (!fetched) return toPendingTransaction(original);

  const settledStatus = readSettledStatus(original, fetched);
  if (!settledStatus) return toPendingTransaction(original);

  const prefersLocalTransaction = shouldPreferLocalTransaction(original.type);
  if (!isMinedTransaction(fetched)) {
    return prefersLocalTransaction ? buildSettledTransaction(original, settledStatus) : { ...original, ...fetched, status: settledStatus };
  }

  return prefersLocalTransaction ? mergePreferredLocalMinedTransaction(original, fetched) : fetched;
}

function toPendingTransaction(transaction: RainbowTransaction): PendingTransaction {
  const title = buildTransactionTitle(transaction.type, TransactionStatus.pending);

  if (isPendingTransaction(transaction) && transaction.title === title) {
    return transaction;
  }

  return {
    ...transaction,
    status: TransactionStatus.pending,
    title,
  };
}

function buildSettledTransaction(transaction: RainbowTransaction, status: SettledTransaction['status']): SettledTransaction {
  return {
    ...transaction,
    status,
    title: buildTransactionTitle(transaction.type, status),
  };
}

function shouldPreferLocalTransaction(originalType: RainbowTransaction['type']): boolean {
  switch (originalType) {
    case 'bridge':
    case 'cancel':
    case 'speed_up':
    case 'swap':
      return true;
    default:
      return false;
  }
}

function isSettledStatus(status: TransactionStatus): status is SettledTransaction['status'] {
  return status === TransactionStatus.confirmed || status === TransactionStatus.failed;
}

function isPendingTransaction(transaction: RainbowTransaction): transaction is PendingTransaction {
  return transaction.status === TransactionStatus.pending;
}

function readSettledStatus(original: RainbowTransaction, fetched: RainbowTransaction): SettledTransaction['status'] | null {
  const status = isValidTransactionStatus(fetched.status) ? fetched.status : original.status;
  return isSettledStatus(status) ? status : null;
}

function isMinedTransaction(transaction: RainbowTransaction | null): transaction is MinedTransaction {
  return (
    transaction !== null &&
    transaction.status !== TransactionStatus.pending &&
    typeof transaction.blockNumber === 'number' &&
    typeof transaction.confirmations === 'number' &&
    typeof transaction.minedAt === 'number'
  );
}

function mergePreferredLocalMinedTransaction(original: RainbowTransaction, fetched: MinedTransaction): MinedTransaction {
  return {
    ...fetched,
    ...original,
    blockNumber: fetched.blockNumber,
    confirmations: fetched.confirmations,
    gasUsed: fetched.gasUsed,
    hash: fetched.hash,
    minedAt: fetched.minedAt,
    status: fetched.status,
    title: buildTransactionTitle(original.type, fetched.status),
  };
}

function readOriginTxHash(status: RelayStatusSnapshot): `0x${string}` | undefined {
  return status.onchain?.origin.txHashes[0];
}

function bindManagedOriginTxHash(transaction: RainbowTransaction, txHash: `0x${string}` | undefined): RainbowTransaction {
  if (!txHash || transaction.hash === txHash) return transaction;

  return { ...transaction, hash: txHash };
}
