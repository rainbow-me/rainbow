import {
  buildTransactionTitle,
  isAwaitingRelayTransactionHash,
  isValidTransactionStatus,
  TransactionStatus,
  type MinedTransaction,
  type PendingTransaction,
  type RainbowTransaction,
  type TransactionType,
} from '@/entities/transactions';
import { applyManagedExecutionStatus } from '@/features/delegation/managedExecutionStatus';
import { relayService } from '@/features/delegation/relayService';
import { logger, RainbowError } from '@/logger';
import type { SupportedCurrencyKey } from '@/references/supportedCurrencies';
import { fetchRawTransaction } from '@/resources/transactions/transaction';
import { RelayExecutionStatus, type RelayStatusSnapshot } from '@rainbow-me/delegation';

// ============ Types ========================================================= //

type SettledTransaction = RainbowTransaction & {
  status: TransactionStatus.confirmed | TransactionStatus.failed;
};

type TrackedTransactionResolution =
  | { kind: 'pending'; relayStatus?: RelayStatusSnapshot; transaction: PendingTransaction }
  | { kind: 'settled'; relayStatus?: RelayStatusSnapshot; transaction: SettledTransaction };

// ============ API =========================================================== //

/**
 * Resolves a locally tracked transaction overlay to its current onchain
 * or relay-backed state.
 *
 * Wallet-owned transactions settle by transaction hash. Managed relay
 * transactions settle by relay status and may be re-resolved after local
 * confirmation while relay-owned onchain evidence is still incomplete.
 */
export async function resolveTrackedTransaction({
  abortController,
  address,
  currency,
  transaction,
}: {
  abortController: AbortController | null;
  address: string;
  currency: SupportedCurrencyKey;
  transaction: RainbowTransaction;
}): Promise<TrackedTransactionResolution> {
  if (transaction.relayExecutionId) {
    return resolveManagedTrackedTransaction({
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

// ============ Fetch Functions ============================================== //

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
}): Promise<TrackedTransactionResolution> {
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

async function resolveManagedTrackedTransaction({
  abortController,
  address,
  currency,
  transaction,
}: {
  abortController: AbortController | null;
  address: string;
  currency: SupportedCurrencyKey;
  transaction: RainbowTransaction;
}): Promise<TrackedTransactionResolution> {
  try {
    const executionId = transaction.relayExecutionId;
    if (!executionId) return preserveTrackedTransaction(transaction);

    const { status: relayStatus } = await relayService.getStatus(executionId);
    const trackedTransaction = applyManagedExecutionStatus(transaction, relayStatus);
    const isAwaitingOriginTxHash = isAwaitingRelayTransactionHash(trackedTransaction);

    switch (relayStatus.status) {
      case RelayExecutionStatus.Confirmed:
        if (isAwaitingOriginTxHash) {
          logger.warn('[resolveTrackedTransaction]: managed relay execution finished without onchain transaction evidence', {
            executionId,
            status: relayStatus.status,
          });
        }

        return {
          kind: 'settled',
          relayStatus,
          transaction: buildSettledTransaction(trackedTransaction, TransactionStatus.confirmed),
        };

      case RelayExecutionStatus.Failed:
      case RelayExecutionStatus.Reverted:
        return {
          kind: 'settled',
          relayStatus,
          transaction: buildSettledTransaction(trackedTransaction, TransactionStatus.failed),
        };

      default:
        if (isSettledStatus(transaction.status)) {
          return {
            kind: 'settled',
            relayStatus,
            transaction: buildSettledTransaction(trackedTransaction, transaction.status),
          };
        }

        if (isAwaitingOriginTxHash) {
          return { kind: 'pending', relayStatus, transaction: toPendingTransaction(trackedTransaction) };
        }

        return {
          ...(await resolveOnchainPendingTransaction({
            abortController,
            address,
            currency,
            transaction: trackedTransaction,
          })),
          relayStatus,
        };
    }
  } catch (e) {
    logger.error(new RainbowError('[resolveTrackedTransaction]: Failed to fetch managed relay execution status', e), {
      executionId: transaction.relayExecutionId,
    });
    return preserveTrackedTransaction(transaction);
  }
}

// ============ Helpers ======================================================= //

function applyTransactionUpdates(
  original: RainbowTransaction,
  fetched: RainbowTransaction | null
): PendingTransaction | SettledTransaction {
  if (!fetched) return toPendingTransaction(original);

  const settledStatus = readSettledStatus(original, fetched);
  if (!settledStatus) return toPendingTransaction(original);

  const preferLocalTransaction = shouldPreferLocalTransaction(original.type);

  if (!isMinedTransaction(fetched)) {
    return preferLocalTransaction ? buildSettledTransaction(original, settledStatus) : { ...original, ...fetched, status: settledStatus };
  }

  return preferLocalTransaction ? mergePreferredLocalMinedTransaction(original, fetched) : fetched;
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

function preserveTrackedTransaction(transaction: RainbowTransaction): TrackedTransactionResolution {
  if (isSettledStatus(transaction.status)) {
    return {
      kind: 'settled',
      transaction: buildSettledTransaction(transaction, transaction.status),
    };
  }

  return {
    kind: 'pending',
    transaction: toPendingTransaction(transaction),
  };
}

function buildSettledTransaction(transaction: RainbowTransaction, status: SettledTransaction['status']): SettledTransaction {
  const title = buildTransactionTitle(transaction.type, status);

  if (isMatchingSettledTransaction(transaction, status, title)) return transaction;

  return {
    ...transaction,
    status,
    title,
  };
}

function shouldPreferLocalTransaction(originalType: TransactionType): boolean {
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

function readSettledStatus(original: RainbowTransaction, fetched: RainbowTransaction): SettledTransaction['status'] | null {
  const status = isValidTransactionStatus(fetched.status) ? fetched.status : original.status;
  return isSettledStatus(status) ? status : null;
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

// ============ Type Checks =================================================== //

function isMinedTransaction(transaction: RainbowTransaction | null): transaction is MinedTransaction {
  return (
    transaction !== null &&
    transaction.status !== TransactionStatus.pending &&
    typeof transaction.blockNumber === 'number' &&
    typeof transaction.confirmations === 'number' &&
    typeof transaction.minedAt === 'number'
  );
}

function isSettledStatus(status: TransactionStatus): status is SettledTransaction['status'] {
  return status === TransactionStatus.confirmed || status === TransactionStatus.failed;
}

function isPendingTransaction(transaction: RainbowTransaction): transaction is PendingTransaction {
  return transaction.status === TransactionStatus.pending;
}

function isMatchingSettledTransaction(
  transaction: RainbowTransaction,
  status: SettledTransaction['status'],
  title: string
): transaction is SettledTransaction {
  return transaction.status === status && transaction.title === title;
}
