import { useCallback } from 'react';

import type { Address } from 'viem';

import { analytics } from '@/analytics';
import { event } from '@/analytics/event';
import { rainbowToastsActions } from '@/components/rainbow-toast/useRainbowToastsStore';
import {
  isAwaitingRelayTransactionHash,
  TransactionStatus,
  type PendingTransaction,
  type RainbowTransaction,
} from '@/entities/transactions';
import { areDestinationTxHashesEqual } from '@/features/delegation/managedExecutionStatus';
import { logger, RainbowError } from '@/logger';
import { queryClient } from '@/react-query';
import type { SupportedCurrencyKey } from '@/references/supportedCurrencies';
import { consolidatedTransactionsQueryKey } from '@/resources/transactions/consolidatedTransactions';
import { fetchRawTransaction, type PaginatedTransactions } from '@/resources/transactions/transaction';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { useAssetUpdatesStore } from '@/state/assetUpdates/assetUpdates';
import { backendNetworksActions } from '@/state/backendNetworks/backendNetworks';
import { pendingTransactionsActions, usePendingTransactionsStore } from '@/state/pendingTransactions';
import { type RelayStatusSnapshot } from '@rainbow-me/delegation';

import { resolveTrackedTransaction } from './pendingTransactionResolution';

// ============ Types ========================================================== //

type WatchPendingTransactionsArgs = {
  abortController: AbortController;
  address: Address;
  currency: SupportedCurrencyKey;
  transactions: PendingTransaction[];
};

type SettledTransaction = Extract<Awaited<ReturnType<typeof resolveTrackedTransaction>>, { kind: 'settled' }>['transaction'];
type TransactionHistoryPages = NonNullable<PaginatedTransactions['pages']>;

type TransactionEntry = {
  nextTransaction: RainbowTransaction;
  relayStatus?: RelayStatusSnapshot;
  settledTransition?: SettledTransaction;
};

// ============ API ============================================================ //

/**
 * Returns the pending-transaction watcher callback scoped to `address`.
 */
export const useWatchPendingTransactions = ({ address }: { address: Address }) => {
  const currency = userAssetsStoreManager(state => state.currency);

  return useCallback(
    (transactions: PendingTransaction[], abortController: AbortController) =>
      watchPendingTransactions({
        abortController,
        address,
        currency,
        transactions,
      }),
    [address, currency]
  );
};

/**
 * Resolves pending-transaction overlays, triggers side effects for newly
 * settled transactions, and keeps hash-backed successful overlays visible until
 * history catches up.
 */
export async function watchPendingTransactions({
  abortController,
  address,
  currency,
  transactions,
}: WatchPendingTransactionsArgs): Promise<void> {
  if (!transactions.length) return;

  const currentTransactions = readStoredTransactions(address);
  let canceled = abortController.signal.aborted;
  abortController.signal.addEventListener('abort', () => {
    canceled = true;
  });

  const now = Math.floor(Date.now() / 1000);
  const entries = await Promise.all(
    transactions.map(transaction =>
      readTransactionEntry({
        abortController,
        address,
        currency,
        transaction,
      })
    )
  );

  if (canceled) return;

  const relayStatuses: RelayStatusSnapshot[] = [];
  const settledTransitions: SettledTransaction[] = [];
  const confirmedTransitions: SettledTransaction[] = [];

  for (const entry of entries) {
    if (entry.relayStatus) relayStatuses.push(entry.relayStatus);

    const settledTransition = entry.settledTransition;
    if (!settledTransition) continue;

    settledTransitions.push(settledTransition);
    if (settledTransition.status === TransactionStatus.confirmed) confirmedTransitions.push(settledTransition);
  }

  const historyPages = readHistoryPages({ address, currency });
  const visibleTransactions = buildVisibleTransactions({
    currentTransactions,
    entries,
    historyPages,
  });

  pendingTransactionsActions.setPendingTransactions({
    address,
    pendingTransactions: visibleTransactions,
  });

  if (settledTransitions.length) {
    settledTransitions.forEach(transaction => rainbowToastsActions.handleTransaction(transaction));
  }

  if (confirmedTransitions.length) {
    useAssetUpdatesStore.getState().addWatchedTransactions({
      address,
      transactions: confirmedTransitions,
    });

    confirmedTransitions.forEach(transaction => {
      analytics.track(event.pendingTransactionResolved, {
        chainId: transaction.chainId,
        type: transaction.type,
        timeToResolve: typeof transaction.minedAt === 'number' ? (now - transaction.minedAt) * 1000 : undefined,
      });
    });
  }

  const hasIndexableConfirmation = confirmedTransitions.some(transaction => !isAwaitingRelayTransactionHash(transaction));
  if (!hasIndexableConfirmation && !relayStatuses.length) return;

  void syncConsolidatedHistory({
    address,
    currency,
    hasIndexableConfirmation,
    historyPages,
    relayStatuses,
  });
}

// ============ Resolution ===================================================== //

async function readTransactionEntry({
  abortController,
  address,
  currency,
  transaction,
}: {
  abortController: AbortController;
  address: Address;
  currency: SupportedCurrencyKey;
  transaction: PendingTransaction;
}): Promise<TransactionEntry> {
  const resolution = await resolveTrackedTransaction({
    abortController,
    address,
    currency,
    transaction,
  });

  const relayStatus = resolution.relayStatus;
  const trackedTransaction = resolution.transaction;
  const settledTransition = resolution.kind === 'settled' ? resolution.transaction : undefined;

  return {
    nextTransaction: trackedTransaction,
    relayStatus: relayStatus && didRelayEvidenceChange(transaction, trackedTransaction) ? relayStatus : undefined,
    settledTransition,
  };
}

function didRelayEvidenceChange(previousTransaction: RainbowTransaction, nextTransaction: RainbowTransaction): boolean {
  if (nextTransaction.hash !== previousTransaction.hash) {
    return true;
  }
  return !areDestinationTxHashesEqual(previousTransaction.relayDestinationTxHashes, nextTransaction.relayDestinationTxHashes);
}

// ============ History Sync =================================================== //

async function syncConsolidatedHistory({
  address,
  currency,
  hasIndexableConfirmation,
  historyPages,
  relayStatuses,
}: {
  address: Address;
  currency: SupportedCurrencyKey;
  hasIndexableConfirmation: boolean;
  historyPages: TransactionHistoryPages;
  relayStatuses: readonly RelayStatusSnapshot[];
}): Promise<void> {
  try {
    const relayTransactionLookupCount = relayStatuses.length
      ? await lookupRelayTransactionsByHash({ address, currency, historyPages, relayStatuses })
      : 0;

    if (!hasIndexableConfirmation && relayTransactionLookupCount === 0) return;

    await queryClient.refetchQueries({
      queryKey: consolidatedTransactionsQueryKey({
        address,
        currency,
        chainIds: backendNetworksActions.getSupportedMainnetChainIds(),
      }),
      type: 'all',
    });

    pruneIndexedTransactions({ address, currency });
  } catch (error) {
    logger.error(new RainbowError('[watchPendingTransactions]: Failed to sync indexed transaction history', error), {
      address,
      relayStatuses: relayStatuses.length,
    });
  }
}

async function lookupRelayTransactionsByHash({
  address,
  currency,
  historyPages,
  relayStatuses,
}: {
  address: Address;
  currency: SupportedCurrencyKey;
  historyPages: TransactionHistoryPages;
  relayStatuses: readonly RelayStatusSnapshot[];
}): Promise<number> {
  const seen = new Set<string>();
  const requests: Promise<RainbowTransaction | null>[] = [];

  for (const relayStatus of relayStatuses) {
    const onchain = relayStatus.onchain;
    if (!onchain) continue;

    for (const hash of onchain.origin.txHashes) {
      const identity = `${onchain.origin.chainId}:${hash.toLowerCase()}`;
      if (seen.has(identity) || isTransactionInHistory({ historyPages, transaction: { chainId: onchain.origin.chainId, hash } })) continue;

      seen.add(identity);
      requests.push(
        fetchRawTransaction({
          address,
          currency,
          chainId: onchain.origin.chainId,
          hash,
        })
      );
    }

    if (onchain.type !== 'crosschain') continue;

    for (const hash of onchain.destination.txHashes) {
      const identity = `${onchain.destination.chainId}:${hash.toLowerCase()}`;
      if (seen.has(identity) || isTransactionInHistory({ historyPages, transaction: { chainId: onchain.destination.chainId, hash } }))
        continue;

      seen.add(identity);
      requests.push(
        fetchRawTransaction({
          address,
          currency,
          chainId: onchain.destination.chainId,
          hash,
        })
      );
    }
  }

  if (!requests.length) return 0;

  await Promise.allSettled(requests);
  return requests.length;
}

// ============ Visibility ===================================================== //

const EMPTY_PAGES: TransactionHistoryPages = [];
const EMPTY_TRANSACTIONS: RainbowTransaction[] = [];

function readStoredTransactions(address: Address): RainbowTransaction[] {
  return usePendingTransactionsStore.getState().pendingTransactions[address] || EMPTY_TRANSACTIONS;
}

function readHistoryPages({ address, currency }: { address: Address; currency: SupportedCurrencyKey }): TransactionHistoryPages {
  const queryData = queryClient.getQueryData<PaginatedTransactions>(
    consolidatedTransactionsQueryKey({
      address,
      currency,
      chainIds: backendNetworksActions.getSupportedMainnetChainIds(),
    })
  );

  return queryData?.pages ?? EMPTY_PAGES;
}

function buildVisibleTransactions({
  currentTransactions,
  entries,
  historyPages,
}: {
  currentTransactions: RainbowTransaction[];
  entries: TransactionEntry[];
  historyPages: TransactionHistoryPages;
}): RainbowTransaction[] {
  const visibleTransactions: RainbowTransaction[] = [];
  let pendingEntryIndex = 0;

  for (const transaction of currentTransactions) {
    let nextTransaction = transaction;

    if (transaction.status === TransactionStatus.pending) {
      nextTransaction = entries[pendingEntryIndex]?.nextTransaction ?? transaction;
      pendingEntryIndex += 1;
    }

    if (shouldKeepTransactionVisible({ historyPages, transaction: nextTransaction })) {
      visibleTransactions.push(nextTransaction);
    }
  }

  return visibleTransactions;
}

function pruneIndexedTransactions({ address, currency }: { address: Address; currency: SupportedCurrencyKey }): void {
  const historyPages = readHistoryPages({ address, currency });
  const currentTransactions = readStoredTransactions(address);
  const visibleTransactions = currentTransactions.filter(transaction => shouldKeepTransactionVisible({ historyPages, transaction }));

  pendingTransactionsActions.setPendingTransactions({
    address,
    pendingTransactions: visibleTransactions,
  });
}

function shouldKeepTransactionVisible({
  historyPages,
  transaction,
}: {
  historyPages: TransactionHistoryPages;
  transaction: RainbowTransaction;
}): boolean {
  if (transaction.status === TransactionStatus.pending) return true;
  if (transaction.status === TransactionStatus.failed) return false;
  if (isAwaitingRelayTransactionHash(transaction)) return false;
  return !isTransactionInHistory({ historyPages, transaction });
}

function isTransactionInHistory({
  historyPages,
  transaction,
}: {
  historyPages: TransactionHistoryPages;
  transaction: Pick<RainbowTransaction, 'chainId' | 'hash'>;
}): boolean {
  const targetHash = transaction.hash.toLowerCase();

  for (const page of historyPages) {
    if (
      page.transactions.some(
        indexedTransaction => indexedTransaction.chainId === transaction.chainId && indexedTransaction.hash.toLowerCase() === targetHash
      )
    ) {
      return true;
    }
  }

  return false;
}
