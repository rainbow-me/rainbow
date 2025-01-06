import { useMemo, useCallback } from 'react';
import useAccountSettings from './useAccountSettings';
import { userAssetsQueryKey } from '@/__swaps__/screens/Swap/resources/assets/userAssets';
import { RainbowTransaction, MinedTransaction, TransactionStatus } from '@/entities';
import { transactionFetchQuery } from '@/resources/transactions/transaction';
import { RainbowError, logger } from '@/logger';
import { consolidatedTransactionsQueryKey } from '@/resources/transactions/consolidatedTransactions';
import { queryClient } from '@/react-query/queryClient';
import { invalidateAddressNftsQueries } from '@/resources/nfts';
import { usePendingTransactionsStore } from '@/state/pendingTransactions';
import { Address } from 'viem';
import { staleBalancesStore } from '@/state/staleBalances';
import { useConnectedToAnvilStore } from '@/state/connectedToAnvil';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';

export const useWatchPendingTransactions = ({ address }: { address: string }) => {
  const storePendingTransactions = usePendingTransactionsStore(state => state.pendingTransactions);
  const setPendingTransactions = usePendingTransactionsStore(state => state.setPendingTransactions);

  const { connectedToAnvil } = useConnectedToAnvilStore();

  const pendingTransactions = useMemo(() => storePendingTransactions[address] || [], [address, storePendingTransactions]);

  const { nativeCurrency } = useAccountSettings();

  const refreshAssets = useCallback(
    (_: RainbowTransaction) => {
      // NOTE: We have two user assets stores right now, so let's invalidate both queries and trigger a refetch
      queryClient.invalidateQueries(
        userAssetsQueryKey({
          address,
          currency: nativeCurrency,
          testnetMode: connectedToAnvil,
        })
      );
      invalidateAddressNftsQueries(address);
    },
    [address, connectedToAnvil, nativeCurrency]
  );

  const processSupportedNetworkTransaction = useCallback(
    async (tx: RainbowTransaction) => {
      const transaction = await transactionFetchQuery({
        hash: tx.hash,
        chainId: tx.chainId,
        address,
        currency: nativeCurrency,
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
        refreshAssets(tx);
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
            processStaleAsset({ asset: change?.asset, address, transactionHash: tx?.hash });
          });
        } else if (tx.asset) {
          processStaleAsset({ address, asset: tx.asset, transactionHash: tx?.hash });
        }
      });

      queryClient.refetchQueries({
        queryKey: userAssetsQueryKey({ address, currency: nativeCurrency, testnetMode: connectedToAnvil }),
      });

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
  }, [address, connectedToAnvil, nativeCurrency, pendingTransactions, processPendingTransaction, setPendingTransactions]);

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
