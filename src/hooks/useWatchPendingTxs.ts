import { useCallback, useRef } from 'react';

import type { Address, Hash } from 'viem';

import { analytics } from '@/analytics';
import { event } from '@/analytics/event';
import { rainbowToastsActions } from '@/components/rainbow-toast/useRainbowToastsStore';
import {
  isAwaitingRelayTransactionHash,
  TransactionStatus,
  type PendingTransaction,
  type RainbowTransaction,
} from '@/entities/transactions';
import type { SupportedCurrencyKey } from '@/features/currency/supportedCurrencies';
import { areDestinationTxHashesEqual } from '@/features/delegation/utils/managedExecutionStatus';
import { backendNetworksActions } from '@/features/network/stores/backendNetworksStore';
import { type ChainId } from '@/features/network/types/backendNetworks';
import { logger, RainbowError } from '@/logger';
import { queryClient } from '@/react-query';
import { consolidatedTransactionsQueryKey } from '@/resources/transactions/consolidatedTransactions';
import { fetchRawTransaction, type PaginatedTransactions } from '@/resources/transactions/transaction';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { useAssetUpdatesStore } from '@/state/assetUpdates/assetUpdates';
import { pendingTransactionsActions, usePendingTransactionsStore } from '@/state/pendingTransactions';
import { type RelayStatusSnapshot } from '@rainbow-me/sdk';

import { resolveTrackedTransaction } from './pendingTransactionResolution';

// ============ Types ========================================================== //

type TransactionHistoryPages = NonNullable<PaginatedTransactions['pages']>;

// ============ API ============================================================ //

/**
 * Creates a watcher that polls one pending transaction per run.
 * Selection advances in round-robin order, keeping each run's request work independent of the
 * number of pending transactions.
 */
export const useWatchPendingTransactions = ({ address }: { address: Address }) => {
  const currency = userAssetsStoreManager(state => state.currency);
  const nextTransactionIndex = useRef(0);

  return useCallback(
    (transactions: PendingTransaction[], abortController: AbortController) => {
      if (!transactions.length) return Promise.resolve();

      const transactionIndex = nextTransactionIndex.current % transactions.length;
      nextTransactionIndex.current = (transactionIndex + 1) % transactions.length;

      return watchPendingTransaction({
        abortController,
        address,
        currency,
        transaction: transactions[transactionIndex],
      });
    },
    [address, currency]
  );
};

/**
 * Resolves one pending transaction and applies the result to the latest local overlays.
 * If that transaction was replaced while the request was in flight, the stale result is discarded.
 */
export async function watchPendingTransaction({
  abortController,
  address,
  currency,
  transaction,
}: {
  abortController: AbortController;
  address: Address;
  currency: SupportedCurrencyKey;
  transaction: PendingTransaction;
}): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const resolution = await resolveTrackedTransaction({
    abortController,
    address,
    currency,
    transaction,
  });

  if (abortController.signal.aborted) return;

  const currentTransactions = usePendingTransactionsStore.getState().pendingTransactions[address];
  if (!currentTransactions?.includes(transaction)) return;

  const historyPages = readHistoryPages({ address, currency });
  const visibleTransactions = buildVisibleTransactions({
    currentTransactions,
    historyPages,
    nextTransaction: resolution.transaction,
    sourceTransaction: transaction,
  });

  pendingTransactionsActions.setPendingTransactions({
    address,
    pendingTransactions: visibleTransactions,
  });

  const settledTransaction = resolution.kind === 'settled' ? resolution.transaction : undefined;
  if (settledTransaction) rainbowToastsActions.handleTransaction(settledTransaction);

  const isConfirmed = settledTransaction?.status === TransactionStatus.confirmed;
  if (isConfirmed) {
    useAssetUpdatesStore.getState().addWatchedTransactions({
      address,
      transactions: [settledTransaction],
    });

    analytics.track(event.pendingTransactionResolved, {
      chainId: settledTransaction.chainId,
      type: settledTransaction.type,
      timeToResolve: typeof settledTransaction.minedAt === 'number' ? (now - settledTransaction.minedAt) * 1000 : undefined,
    });
  }

  const hasIndexableConfirmation = isConfirmed && !isAwaitingRelayTransactionHash(settledTransaction);
  const relayStatus =
    resolution.relayStatus && didRelayOnchainEvidenceChange(transaction, resolution.transaction) ? resolution.relayStatus : undefined;

  if (!hasIndexableConfirmation && !relayStatus) return;

  void syncConsolidatedHistory({
    address,
    currency,
    hasIndexableConfirmation,
    historyPages,
    relayStatus,
  });
}

function didRelayOnchainEvidenceChange(previousTransaction: RainbowTransaction, nextTransaction: RainbowTransaction): boolean {
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
  relayStatus,
}: {
  address: Address;
  currency: SupportedCurrencyKey;
  hasIndexableConfirmation: boolean;
  historyPages: TransactionHistoryPages;
  relayStatus?: RelayStatusSnapshot;
}): Promise<void> {
  try {
    const didRequestRelayTransactions = relayStatus
      ? await requestRelayTransactionsByHash({ address, currency, historyPages, relayStatus })
      : false;

    if (!hasIndexableConfirmation && !didRequestRelayTransactions) return;

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
    logger.error(new RainbowError('[watchPendingTransaction]: Failed to sync indexed transaction history', error), {
      address,
      relayStatus: relayStatus?.status,
    });
  }
}

async function requestRelayTransactionsByHash({
  address,
  currency,
  historyPages,
  relayStatus,
}: {
  address: Address;
  currency: SupportedCurrencyKey;
  historyPages: TransactionHistoryPages;
  relayStatus: RelayStatusSnapshot;
}): Promise<boolean> {
  const onchain = relayStatus.onchain;
  if (!onchain) return false;

  const seen = new Set<string>();
  const requests: Promise<RainbowTransaction | null>[] = [];

  function queueTransactionLookups(source: { chainId: ChainId; txHashes: readonly Hash[] }): void {
    for (const hash of source.txHashes) {
      const identity = `${source.chainId}:${hash.toLowerCase()}`;
      if (seen.has(identity) || isTransactionInHistory({ historyPages, transaction: { chainId: source.chainId, hash } })) continue;

      seen.add(identity);
      requests.push(fetchRawTransaction({ address, currency, chainId: source.chainId, hash }));
    }
  }

  queueTransactionLookups(onchain.origin);
  if (onchain.type === 'crosschain') {
    queueTransactionLookups(onchain.destination);
  }

  if (!requests.length) return false;

  const results = await Promise.allSettled(requests);
  let failedRequestCount = 0;
  let firstError: unknown;

  for (const result of results) {
    if (result.status === 'fulfilled') continue;
    failedRequestCount += 1;
    firstError ??= result.reason;
  }

  if (failedRequestCount) {
    logger.error(new RainbowError('[watchPendingTransaction]: Failed to look up relay transactions', firstError), {
      failedRequestCount,
      requestCount: requests.length,
    });
  }

  return true;
}

// ============ Visibility ===================================================== //

const EMPTY_PAGES: TransactionHistoryPages = [];

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
  historyPages,
  nextTransaction,
  sourceTransaction,
}: {
  currentTransactions: RainbowTransaction[];
  historyPages: TransactionHistoryPages;
  nextTransaction: RainbowTransaction;
  sourceTransaction: PendingTransaction;
}): RainbowTransaction[] {
  const visibleTransactions: RainbowTransaction[] = [];

  for (const transaction of currentTransactions) {
    const visibleTransaction = transaction === sourceTransaction ? nextTransaction : transaction;

    if (shouldRetainLocalTransactionOverlay({ historyPages, transaction: visibleTransaction })) {
      visibleTransactions.push(visibleTransaction);
    }
  }

  return visibleTransactions;
}

function pruneIndexedTransactions({ address, currency }: { address: Address; currency: SupportedCurrencyKey }): void {
  const historyPages = readHistoryPages({ address, currency });
  const currentTransactions = usePendingTransactionsStore.getState().pendingTransactions[address];
  if (!currentTransactions) return;

  const visibleTransactions = currentTransactions.filter(transaction => shouldRetainLocalTransactionOverlay({ historyPages, transaction }));

  pendingTransactionsActions.setPendingTransactions({
    address,
    pendingTransactions: visibleTransactions,
  });
}

function shouldRetainLocalTransactionOverlay({
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
