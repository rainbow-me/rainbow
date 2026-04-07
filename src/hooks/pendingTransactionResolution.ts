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

type PendingTransactionResolution =
  | { kind: 'pending'; transaction: RainbowTransaction }
  | { kind: 'mined'; transaction: MinedTransaction }
  | { kind: 'toast'; transaction: RainbowTransaction };

type OnchainTransaction = PendingTransaction | MinedTransaction;

/**
 * Resolves a pending transaction through the appropriate channel.
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
    transaction: nextTransaction,
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
}): Promise<OnchainTransaction> {
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
    return buildPendingTransaction(transaction);
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
        transaction: fetchedTransaction,
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

function applyTransactionUpdates(original: RainbowTransaction, fetched: RainbowTransaction | null): OnchainTransaction {
  if (!fetched) return buildPendingTransaction(original);

  const status = isValidTransactionStatus(fetched.status) ? fetched.status : original.status;
  if (status === TransactionStatus.pending) return buildPendingTransaction(original);
  if (!isMinedTransaction(fetched)) return buildPendingTransaction(original);

  if (!shouldPreferLocalTransaction(original.type)) return fetched;

  return mergePreferredLocalMinedTransaction(original, fetched);
}

function buildPendingTransaction(transaction: RainbowTransaction): PendingTransaction {
  return {
    ...transaction,
    status: TransactionStatus.pending,
    title: buildTransactionTitle(transaction.type, TransactionStatus.pending),
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

function isMinedTransaction(transaction: RainbowTransaction): transaction is MinedTransaction {
  return (
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
