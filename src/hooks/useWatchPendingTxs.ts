import { useCallback } from 'react';
import { type RainbowTransaction, type MinedTransaction } from '@/entities/transactions';
import { consolidatedTransactionsQueryKey } from '@/resources/transactions/consolidatedTransactions';
import { pendingTransactionsActions } from '@/state/pendingTransactions';
import { useRainbowToastsStore } from '@/components/rainbow-toast/useRainbowToastsStore';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { analytics } from '@/analytics';
import { event } from '@/analytics/event';
import { useMinedTransactionsStore } from '@/state/minedTransactions/minedTransactions';
import { queryClient } from '@/react-query';
import { resolvePendingTransaction } from './pendingTransactionResolution';

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

      const resolvedTransactions = await Promise.all(
        pendingTransactions.map((transaction: RainbowTransaction) =>
          resolvePendingTransaction({
            abortController,
            address,
            currency: nativeCurrency,
            transaction,
          })
        )
      );

      if (canceled) return;

      const { newPendingTransactions, minedTransactions, toastTransactions } = resolvedTransactions.reduce<{
        newPendingTransactions: RainbowTransaction[];
        minedTransactions: MinedTransaction[];
        toastTransactions: RainbowTransaction[];
      }>(
        (acc, resolution) => {
          if (resolution.kind === 'pending') {
            acc.newPendingTransactions.push(resolution.transaction);
          } else if (resolution.kind === 'mined') {
            acc.minedTransactions.push(resolution.transaction);
            analytics.track(event.pendingTransactionResolved, {
              chainId: resolution.transaction.chainId,
              type: resolution.transaction.type,
              timeToResolve: resolution.transaction.minedAt ? (now - resolution.transaction.minedAt) * 1000 : undefined,
            });
          } else {
            acc.toastTransactions.push(resolution.transaction);
          }

          return acc;
        },
        {
          newPendingTransactions: [],
          minedTransactions: [],
          toastTransactions: [],
        }
      );

      pendingTransactionsActions.setPendingTransactions({
        address,
        pendingTransactions: newPendingTransactions,
      });

      toastTransactions.forEach(tx => useRainbowToastsStore.getState().handleTransaction(tx));

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
