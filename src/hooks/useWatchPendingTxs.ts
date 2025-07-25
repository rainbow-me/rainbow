import { useMemo, useCallback } from 'react';
import { RainbowTransaction, MinedTransaction, TransactionStatus } from '@/entities';
import { transactionFetchQuery } from '@/resources/transactions/transaction';
import { RainbowError, logger } from '@/logger';
import { consolidatedTransactionsQueryKey } from '@/resources/transactions/consolidatedTransactions';
import { queryClient } from '@/react-query/queryClient';
import { invalidateAddressNftsQueries } from '@/resources/nfts';
import { usePendingTransactionsStore } from '@/state/pendingTransactions';
import { Address } from 'viem';
import { staleBalancesStore } from '@/state/staleBalances';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { userAssetsStore } from '@/state/assets/userAssets';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';

export const useWatchPendingTransactions = ({ address }: { address: string }) => {
  const storePendingTransactions = usePendingTransactionsStore(state => state.pendingTransactions);
  const setPendingTransactions = usePendingTransactionsStore(state => state.setPendingTransactions);

  const pendingTransactions = useMemo(() => storePendingTransactions[address] || [], [address, storePendingTransactions]);

  const nativeCurrency = userAssetsStoreManager(state => state.currency);

  const refreshAssets = useCallback(() => {
    userAssetsStore.getState().fetch(undefined, { force: true });
    invalidateAddressNftsQueries(address);
  }, [address]);

  const processSupportedNetworkTransaction = useCallback(
    async (tx: RainbowTransaction) => {
      const transaction = await transactionFetchQuery({
        hash: tx.hash,
        chainId: tx.chainId,
        address,
        currency: nativeCurrency,
        originalType: tx.type,
      });

      return {
        ...tx,
        ...transaction,
      };
    },
    [address, nativeCurrency]
  );

  const processPendingTransaction = useCallback(
    async (tx: RainbowTransaction) => {
      let updatedTransaction: RainbowTransaction = { ...tx };
      try {
        if (tx.chainId && tx.hash && address) {
          updatedTransaction = await processSupportedNetworkTransaction(updatedTransaction);
        } else {
          throw new Error('Pending transaction missing chainId, hash, or address');
        }
      } catch (e) {
        logger.error(new RainbowError(`[useWatchPendingTransaction]: Failed to watch transaction`), {
          message: (e as Error)?.message || 'Unknown error',
        });
      }

      if (updatedTransaction?.status !== TransactionStatus.pending) {
        refreshAssets();
      }
      return updatedTransaction;
    },
    [address, processSupportedNetworkTransaction, refreshAssets]
  );

  const watchPendingTransactions = useCallback(async () => {
    if (!pendingTransactions?.length) return;
    const updatedPendingTransactions = await Promise.all(
      pendingTransactions.map((tx: RainbowTransaction) => processPendingTransaction(tx))
    );

    const { newPendingTransactions, minedTransactions } = updatedPendingTransactions.reduce<{
      newPendingTransactions: RainbowTransaction[];
      minedTransactions: MinedTransaction[];
    }>(
      (acc, tx) => {
        if (tx?.status === TransactionStatus.pending) {
          acc.newPendingTransactions.push(tx);
        } else {
          acc.minedTransactions.push(tx as MinedTransaction);
        }
        return acc;
      },
      {
        newPendingTransactions: [],
        minedTransactions: [],
      }
    );

    if (minedTransactions.length) {
      minedTransactions.forEach(tx => {
        if (tx.changes?.length) {
          tx.changes?.forEach(change => {
            change?.asset && processStaleAsset({ asset: change.asset, address, transactionHash: tx?.hash });
          });
        } else if (tx.asset) {
          processStaleAsset({ address, asset: tx.asset, transactionHash: tx?.hash });
        }
      });

      userAssetsStore.getState().fetch(undefined, { force: true });

      const supportedMainnetChainIds = useBackendNetworksStore.getState().getSupportedMainnetChainIds();

      await queryClient.refetchQueries({
        queryKey: consolidatedTransactionsQueryKey({
          address,
          currency: nativeCurrency,
          chainIds: supportedMainnetChainIds,
        }),
      });

      // in case balances are not updated immediately lets refetch a couple seconds later
      setTimeout(() => {
        queryClient.refetchQueries({
          queryKey: consolidatedTransactionsQueryKey({
            address,
            currency: nativeCurrency,
            chainIds: supportedMainnetChainIds,
          }),
        });
      }, 2000);
    }
    setPendingTransactions({
      address,
      pendingTransactions: newPendingTransactions,
    });
  }, [address, nativeCurrency, pendingTransactions, processPendingTransaction, setPendingTransactions]);

  return { watchPendingTransactions };
};

function processStaleAsset({
  asset,
  address,
  transactionHash,
}: {
  asset: RainbowTransaction['asset'];
  address: string;
  transactionHash: string;
}) {
  const { addStaleBalance } = staleBalancesStore.getState();
  const chainId = asset?.chainId;
  if (asset && typeof chainId === 'number') {
    const changedAssetAddress = asset?.address as Address;
    addStaleBalance({
      address,
      chainId,
      info: {
        address: changedAssetAddress,
        transactionHash,
      },
    });
  }
}
