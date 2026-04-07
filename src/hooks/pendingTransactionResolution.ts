import { RelayExecutionStatus, type RelayStatusSnapshot } from '@rainbow-me/delegation';
import {
  type MinedTransaction,
  type RainbowTransaction,
  TransactionStatus,
  buildTransactionTitle,
  isValidTransactionStatus,
} from '@/entities/transactions';
import { relayService } from '@/features/delegation/relayService';
import { RainbowError, logger } from '@/logger';
import type { SupportedCurrencyKey } from '@/references/supportedCurrencies';
import { fetchRawTransaction } from '@/resources/transactions/transaction';

type PendingTransactionResolution =
  | { kind: 'pending'; transaction: RainbowTransaction }
  | { kind: 'mined'; transaction: MinedTransaction }
  | { kind: 'toast'; transaction: RainbowTransaction };

/**
 * Resolves one pending transaction using the owner that currently knows its progress.
 *
 * Relay-managed transactions stay keyed by `relayExecutionId` until Relay exposes an
 * onchain tx hash. Wallet-owned transactions resolve directly by tx hash.
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
    kind: 'mined',
    transaction: nextTransaction as MinedTransaction,
  };
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
}): Promise<RainbowTransaction> {
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
    return transaction;
  }
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
    if (!executionId) return { kind: 'pending', transaction };

    const update = await relayService.getStatus(executionId);
    const trackedTransaction = bindManagedOriginTxHash(transaction, readOriginTxHash(update.status));
    const hasOnchainTxHash = trackedTransaction.hash !== executionId;

    const terminalStatus = toManagedToastStatus(update.status.status);
    if (!terminalStatus) {
      if (!hasOnchainTxHash) return { kind: 'pending', transaction: trackedTransaction };

      const fetchedTransaction = await fetchTransaction({
        abortController,
        address,
        currency,
        transaction: trackedTransaction,
      });
      if (fetchedTransaction.status === TransactionStatus.pending) {
        return { kind: 'pending', transaction: fetchedTransaction };
      }

      return {
        kind: 'mined',
        transaction: fetchedTransaction as MinedTransaction,
      };
    }

    if (terminalStatus === TransactionStatus.confirmed && !hasOnchainTxHash) {
      logger.warn('[resolvePendingTransaction]: managed relay execution finished without onchain transaction evidence', {
        executionId,
        status: update.status.status,
      });
    }

    return {
      kind: 'toast',
      transaction: buildManagedExecutionToastTransaction(trackedTransaction, terminalStatus),
    };
  } catch (e) {
    logger.error(new RainbowError('[resolvePendingTransaction]: Failed to fetch managed relay execution status', e), {
      executionId: transaction.relayExecutionId,
    });
    return { kind: 'pending', transaction };
  }
}

function applyTransactionUpdates(original: RainbowTransaction, fetched: RainbowTransaction | null): RainbowTransaction {
  if (!fetched) return original;

  const status = isValidTransactionStatus(fetched.status) ? fetched.status : original.status;
  if (status === original.status) return original;

  if (status === TransactionStatus.confirmed && !shouldPreferLocalTransaction(original.type)) {
    return { ...original, ...fetched };
  }

  return {
    ...original,
    status,
    title: buildTransactionTitle(original.type, status),
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

function readOriginTxHash(status: RelayStatusSnapshot): `0x${string}` | undefined {
  return status.onchain?.origin.txHashes[0];
}

function bindManagedOriginTxHash(transaction: RainbowTransaction, txHash: `0x${string}` | undefined): RainbowTransaction {
  if (!txHash || transaction.hash === txHash) return transaction;

  return {
    ...transaction,
    hash: txHash,
  };
}

function toManagedToastStatus(status: RelayExecutionStatus): TransactionStatus.confirmed | TransactionStatus.failed | null {
  switch (status) {
    case RelayExecutionStatus.Confirmed:
      return TransactionStatus.confirmed;
    case RelayExecutionStatus.Failed:
    case RelayExecutionStatus.Reverted:
      return TransactionStatus.failed;
    default:
      return null;
  }
}

function buildManagedExecutionToastTransaction(
  transaction: RainbowTransaction,
  status: TransactionStatus.confirmed | TransactionStatus.failed
): RainbowTransaction {
  return {
    ...transaction,
    status,
    timestamp: Date.now(),
    title: buildTransactionTitle(transaction.type, status),
  };
}
