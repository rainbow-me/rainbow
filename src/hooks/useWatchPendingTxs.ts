import { useCallback } from 'react';
import { RainbowTransaction, MinedTransaction, TransactionStatus } from '@/entities';
import { fetchRawTransaction } from '@/resources/transactions/transaction';
import { RainbowError, logger } from '@/logger';
import { buildTransactionTitle, isValidTransactionStatus } from '@/parsers/transactions';
import { consolidatedTransactionsQueryKey } from '@/resources/transactions/consolidatedTransactions';
import { pendingTransactionsActions } from '@/state/pendingTransactions';
import { useRainbowToastsStore } from '@/components/rainbow-toast/useRainbowToastsStore';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { SupportedCurrencyKey } from '@/references';
import { analytics } from '@/analytics';
import { event } from '@/analytics/event';
import { useMinedTransactionsStore } from '@/state/minedTransactions/minedTransactions';
import { queryClient } from '@/react-query';

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

export const useWatchPendingTransactions = ({ address }: { address: string }) => {
  const nativeCurrency = userAssetsStoreManager(state => state.currency);

  const watchPendingTransactions = useCallback(
    async (pendingTransactions: RainbowTransaction[], abortController: AbortController) => {
      if (!pendingTransactions.length) return;

      // This abort signal will be called if new transactions are received. In that
      // case we need to cancel this fetch since it will now be stale.
      let canceled = abortController.signal.aborted;
      abortController.signal.addEventListener('abort', () => {
        canceled = true;
      });

      const now = Math.floor(Date.now() / 1000);

      const fetchedTransactions = await Promise.all(
        pendingTransactions.map((transaction: RainbowTransaction) =>
          fetchTransaction({ abortController, address, currency: nativeCurrency, transaction })
        )
      );

      if (canceled) return;

      const { newPendingTransactions, minedTransactions } = fetchedTransactions.reduce<{
        newPendingTransactions: RainbowTransaction[];
        minedTransactions: MinedTransaction[];
      }>(
        (acc, tx) => {
          if (tx.status === TransactionStatus.pending) {
            acc.newPendingTransactions.push(tx);
          } else {
            acc.minedTransactions.push(tx as MinedTransaction);
            analytics.track(event.pendingTransactionResolved, {
              chainId: tx.chainId,
              type: tx.type,
              timeToResolve: tx.minedAt ? (now - tx.minedAt) * 1000 : undefined,
            });
          }
          return acc;
        },
        {
          newPendingTransactions: [],
          minedTransactions: [],
        }
      );

      pendingTransactionsActions.setPendingTransactions({
        address,
        pendingTransactions: newPendingTransactions,
      });

      if (!minedTransactions.length) return;

      useMinedTransactionsStore.getState().addMinedTransactions({ address, transactions: minedTransactions });
      minedTransactions.forEach(tx => useRainbowToastsStore.getState().handleTransaction(tx));

      await queryClient.refetchQueries({
        queryKey: consolidatedTransactionsQueryKey({
          address,
          currency: nativeCurrency,
          chainIds: useBackendNetworksStore.getState().getSupportedChainIds(),
        }),
        type: 'all',
      });
    },
    [address, nativeCurrency]
  );

  return watchPendingTransactions;
};

/**
 * If pending, applies only the fields that change during a pending transaction's
 * lifecycle to the original transaction.
 *
 * If confirmed, prefers the fetched transaction over the original for certain
 * transaction types.
 *
 * This works around the lack of rich metadata in fetched pending transactions.
 */
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

/**
 * Prefers local transaction data for a subset of transaction types which
 * contain bad metadata in the confirmed fetched transaction.
 *
 * This primarily affects the labels displayed in the confirmation toast.
 */
function shouldPreferLocalTransaction(originalType: RainbowTransaction['type']): boolean {
  switch (originalType) {
    case 'bridge':
    case 'cancel':
    case 'swap':
      return true;
    default:
      return false;
  }
}
