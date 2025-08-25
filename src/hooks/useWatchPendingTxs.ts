import { useMemo, useCallback } from 'react';
import { RainbowTransaction, MinedTransaction, TransactionStatus } from '@/entities';
import { transactionFetchQuery } from '@/resources/transactions/transaction';
import { RainbowError, logger } from '@/logger';
import { consolidatedTransactionsQueryKey } from '@/resources/transactions/consolidatedTransactions';
import { usePendingTransactionsStore } from '@/state/pendingTransactions';
import { useRainbowToastsStore } from '@/components/rainbow-toast/useRainbowToastsStore';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { SupportedCurrencyKey } from '@/references';
import { analytics } from '@/analytics';
import { event } from '@/analytics/event';
import { useMinedTransactionsStore } from '@/state/minedTransactions/minedTransactions';
import { queryClient } from '@/react-query';

async function fetchTransaction({
  address,
  currency,
  transaction,
}: {
  address: string;
  currency: SupportedCurrencyKey;
  transaction: RainbowTransaction;
}): Promise<RainbowTransaction> {
  try {
    if (!transaction.chainId || !transaction.hash) {
      throw new Error('Pending transaction missing chainId or hash');
    }
    const fetchedTransaction = await transactionFetchQuery({
      address,
      chainId: transaction.chainId,
      currency,
      hash: transaction.hash,
      originalType: transaction.type,
    });

    return {
      ...transaction,
      ...fetchedTransaction,
    };
  } catch (e) {
    logger.error(new RainbowError('[fetchTransaction]: Failed to fetch transaction', e), {
      transaction,
    });
  }

  return transaction;
}

export const useWatchPendingTransactions = ({ address }: { address: string }) => {
  const nativeCurrency = userAssetsStoreManager(state => state.currency);
  const pendingTransactionsByAddress = usePendingTransactionsStore(state => state.pendingTransactions);
  const pendingTransactions = useMemo(() => pendingTransactionsByAddress[address] || [], [address, pendingTransactionsByAddress]);

  const watchPendingTransactions = useCallback(async () => {
    if (!pendingTransactions.length) return;
    const now = Math.floor(Date.now() / 1000);

    const fetchedTransactions = await Promise.all(
      pendingTransactions.map((tx: RainbowTransaction) => fetchTransaction({ address, currency: nativeCurrency, transaction: tx }))
    );

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

    usePendingTransactionsStore.getState().setPendingTransactions({
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
  }, [address, nativeCurrency, pendingTransactions]);

  return { watchPendingTransactions };
};
