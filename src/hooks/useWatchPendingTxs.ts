import { useCallback } from 'react';

import { analytics } from '@/analytics';
import { event } from '@/analytics/event';
import { useRainbowToastsStore } from '@/components/rainbow-toast/useRainbowToastsStore';
import { TransactionStatus, type RainbowTransaction } from '@/entities/transactions';
import { queryClient } from '@/react-query';
import { consolidatedTransactionsQueryKey } from '@/resources/transactions/consolidatedTransactions';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { backendNetworksActions } from '@/state/backendNetworks/backendNetworks';
import { useAssetUpdatesStore, type AssetUpdateTransaction } from '@/state/minedTransactions/minedTransactions';
import { pendingTransactionsActions } from '@/state/pendingTransactions';

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
      const resolutions = await Promise.all(
        pendingTransactions.map(transaction =>
          resolvePendingTransaction({
            abortController,
            address,
            currency: nativeCurrency,
            transaction,
          })
        )
      );

      if (canceled) return;

      const { newPendingTransactions, settledTransactions, transactionsToWatch } = resolutions.reduce<{
        newPendingTransactions: RainbowTransaction[];
        settledTransactions: RainbowTransaction[];
        transactionsToWatch: AssetUpdateTransaction[];
      }>(
        (acc, resolution) => {
          if (resolution.kind === 'pending') {
            acc.newPendingTransactions.push(resolution.transaction);
          } else {
            const transaction = resolution.transaction;
            acc.settledTransactions.push(transaction);
            if (transaction.status === TransactionStatus.confirmed) {
              acc.transactionsToWatch.push(createAssetUpdateTransaction(transaction));
              analytics.track(event.pendingTransactionResolved, {
                chainId: transaction.chainId,
                type: transaction.type,
                timeToResolve: typeof transaction.minedAt === 'number' ? (now - transaction.minedAt) * 1000 : undefined,
              });
            }
          }

          return acc;
        },
        {
          newPendingTransactions: [],
          settledTransactions: [],
          transactionsToWatch: [],
        }
      );

      pendingTransactionsActions.setPendingTransactions({
        address,
        pendingTransactions: newPendingTransactions,
      });

      const handleTransaction = useRainbowToastsStore.getState().handleTransaction;
      settledTransactions.forEach(tx => handleTransaction(tx));

      if (!transactionsToWatch.length) return;

      useAssetUpdatesStore.getState().addWatchedTransactions({
        address,
        transactions: transactionsToWatch,
      });

      await queryClient.refetchQueries({
        queryKey: consolidatedTransactionsQueryKey({
          address,
          currency: nativeCurrency,
          chainIds: backendNetworksActions.getSupportedMainnetChainIds(),
        }),
        type: 'all',
      });
    },
    [address, nativeCurrency]
  );

  return watchPendingTransactions;
};

function createAssetUpdateTransaction(
  transaction: Pick<RainbowTransaction, 'asset' | 'chainId' | 'changes' | 'hash' | 'minedAt' | 'type'>
): AssetUpdateTransaction {
  return {
    asset: transaction.asset,
    chainId: transaction.chainId,
    changes: transaction.changes,
    hash: transaction.hash,
    minedAt: typeof transaction.minedAt === 'number' ? transaction.minedAt : undefined,
    type: transaction.type,
  };
}
