import { useCallback, useRef } from 'react';

import type { Address } from 'viem';

import { analytics } from '@/analytics';
import { event } from '@/analytics/event';
import { rainbowToastsActions } from '@/components/rainbow-toast/useRainbowToastsStore';
import { hasConfirmedOnchainHash, TransactionStatus, type PendingTransaction, type RainbowTransaction } from '@/entities/transactions';
import type { SupportedCurrencyKey } from '@/features/currency/supportedCurrencies';
import { areDestinationTxHashesEqual, getRelayEvmTransactions } from '@/features/delegation/utils/managedExecutionStatus';
import { backendNetworksActions } from '@/features/network/stores/backendNetworksStore';
import type { ChainId } from '@/features/network/types/backendNetworks';
import { logger, RainbowError } from '@/logger';
import { queryClient } from '@/react-query';
import { consolidatedTransactionsQueryKey } from '@/resources/transactions/consolidatedTransactions';
import { fetchRawTransaction, type PaginatedTransactions } from '@/resources/transactions/transaction';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { useAssetUpdatesStore } from '@/state/assetUpdates/assetUpdates';
import { pendingTransactionsActions, usePendingTransactionsStore } from '@/state/pendingTransactions';
import { type RelayOnchainEvidence, type RelayStatusSnapshot } from '@rainbow-me/sdk';

import { resolveTrackedTransaction, type TrackedTransactionResolution } from './pendingTransactionResolution';

// ============ Types ========================================================== //

type TransactionHistoryPages = NonNullable<PaginatedTransactions['pages']>;

// ============ API ============================================================ //

/**
 * Creates a watcher that polls one pending transaction per run.
 * Selection advances in round-robin order, keeping each run's request work independent of the
 * number of pending transactions.
 */
export const useWatchPendingTransactions = ({ address }: { address: Address }) => {
  const currency = userAssetsStoreManager(s => s.currency);
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
 * History reconciliation continues in the background after the local result is applied.
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
  const resolution = await resolveTrackedTransaction({ abortController, address, currency, transaction });
  if (abortController.signal.aborted) return;

  const currentTransactions = usePendingTransactionsStore.getState().pendingTransactions[address];
  if (!currentTransactions?.includes(transaction)) return;

  pendingTransactionsActions.applyTransactionResolution({
    address,
    pendingTransaction: transaction,
    resolvedTransaction: resolution.transaction,
  });

  if (resolution.kind === 'settled') {
    const settledTransaction = resolution.transaction;
    rainbowToastsActions.handleTransaction(settledTransaction);

    if (settledTransaction.status === TransactionStatus.confirmed) {
      useAssetUpdatesStore.getState().addWatchedTransactions({ address, transactions: [settledTransaction] });

      analytics.track(event.pendingTransactionResolved, {
        chainId: settledTransaction.chainId,
        type: settledTransaction.type,
        timeToResolve:
          typeof settledTransaction.minedAt === 'number' ? (Math.floor(Date.now() / 1000) - settledTransaction.minedAt) * 1000 : undefined,
      });
    }
  }

  void reconcileTransactionHistory({ address, currency, transaction, resolution });
}

// ============ History Reconciliation ========================================= //

const EMPTY_HISTORY_PAGES: TransactionHistoryPages = [];

/**
 * Indexes newly resolved relay transactions, refreshes history for onchain evidence,
 * then retires local overlays that history now represents.
 */
async function reconcileTransactionHistory({
  address,
  currency,
  transaction,
  resolution,
}: {
  address: Address;
  currency: SupportedCurrencyKey;
  transaction: PendingTransaction;
  resolution: TrackedTransactionResolution;
}): Promise<void> {
  const { relayStatus, transaction: resolvedTransaction } = resolution;

  try {
    let didFetchRelayTransactions = false;

    if (relayStatus && didRelayOnchainEvidenceChange(transaction, resolvedTransaction)) {
      didFetchRelayTransactions = await requestRelayTransactionsByHash({ address, currency, relayStatus });
    }

    if (!didFetchRelayTransactions && !hasConfirmedOnchainHash(resolvedTransaction)) return;

    await queryClient.refetchQueries({
      queryKey: consolidatedTransactionsQueryKey({
        address,
        currency,
        chainIds: backendNetworksActions.getSupportedMainnetChainIds(),
      }),
      type: 'all',
    });

    const currentOverlays = usePendingTransactionsStore.getState().pendingTransactions[address];
    if (!currentOverlays) return;

    pendingTransactionsActions.setPendingTransactions({
      address,
      pendingTransactions: getVisibleTransactionOverlays(address, currency, currentOverlays),
    });
  } catch (error) {
    logger.error(new RainbowError('[watchPendingTransaction]: Failed to reconcile transaction history', error), {
      address,
      relayStatus: relayStatus?.status,
    });
  }
}

/**
 * Fetches relay transactions by hash so they're indexed by the
 * backend before history refreshes.
 */
async function requestRelayTransactionsByHash({
  address,
  currency,
  relayStatus,
}: {
  address: Address;
  currency: SupportedCurrencyKey;
  relayStatus: RelayStatusSnapshot;
}): Promise<boolean> {
  const onchain = relayStatus.onchain;
  if (!onchain) return false;

  const transactions = getRelayTransactionsMissingFromHistory(address, currency, onchain);
  if (!transactions.length) return false;

  const rejections = (
    await Promise.allSettled(transactions.map(({ chainId, hash }) => fetchRawTransaction({ address, currency, chainId, hash })))
  ).filter(result => result.status === 'rejected');

  if (rejections.length) {
    logger.error(new RainbowError('[watchPendingTransaction]: Failed to look up relay transactions', rejections[0].reason), {
      failedRequestCount: rejections.length,
      requestCount: transactions.length,
    });
  }

  return true;
}

function getRelayTransactionsMissingFromHistory(
  address: Address,
  currency: SupportedCurrencyKey,
  onchain: RelayOnchainEvidence
): Pick<RainbowTransaction, 'chainId' | 'hash'>[] {
  let relayTransactionsById: Record<string, Pick<RainbowTransaction, 'chainId' | 'hash'>> | undefined;

  for (const { chainId, hashes } of getRelayEvmTransactions(onchain)) {
    for (const hash of hashes) {
      (relayTransactionsById ??= {})[transactionId(chainId, hash)] ??= { chainId, hash };
    }
  }

  if (!relayTransactionsById) return [];

  for (const id of eachTransactionIdInHistory(address, currency)) {
    delete relayTransactionsById[id];
  }

  return Object.values(relayTransactionsById);
}

function readHistoryPages(address: Address, currency: SupportedCurrencyKey): TransactionHistoryPages {
  const queryData = queryClient.getQueryData<PaginatedTransactions>(
    consolidatedTransactionsQueryKey({
      address,
      currency,
      chainIds: backendNetworksActions.getSupportedMainnetChainIds(),
    })
  );

  return queryData?.pages ?? EMPTY_HISTORY_PAGES;
}

function getVisibleTransactionOverlays(
  address: Address,
  currency: SupportedCurrencyKey,
  overlays: RainbowTransaction[]
): RainbowTransaction[] {
  let indexedTransactionIds: Set<string> | undefined;

  return overlays.filter(overlay => {
    if (overlay.status === TransactionStatus.pending) return true;
    if (!hasConfirmedOnchainHash(overlay)) return false;

    indexedTransactionIds ??= new Set(eachTransactionIdInHistory(address, currency));

    return !indexedTransactionIds.has(transactionId(overlay.chainId, overlay.hash));
  });
}

function didRelayOnchainEvidenceChange(previousTransaction: RainbowTransaction, nextTransaction: RainbowTransaction): boolean {
  return (
    nextTransaction.hash !== previousTransaction.hash ||
    !areDestinationTxHashesEqual(previousTransaction.relayDestinationTxHashes, nextTransaction.relayDestinationTxHashes)
  );
}

function* eachTransactionIdInHistory(address: Address, currency: SupportedCurrencyKey): Generator<string> {
  for (const page of readHistoryPages(address, currency)) {
    for (const transaction of page.transactions) {
      yield transactionId(transaction.chainId, transaction.hash);
    }
  }
}

function transactionId(chainId: ChainId, hash: string): string {
  return `${chainId}:${hash.toLowerCase()}`;
}
