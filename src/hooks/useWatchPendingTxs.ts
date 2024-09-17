import { useCallback, useMemo } from 'react';
import useAccountSettings from './useAccountSettings';
import { RainbowTransaction, MinedTransaction } from '@/entities/transactions/transaction';
import { userAssetsQueryKey } from '@/__swaps__/screens/Swap/resources/assets/userAssets';
import { transactionFetchQuery } from '@/resources/transactions/transaction';
import { RainbowError, logger } from '@/logger';
import { getProvider } from '@/handlers/web3';
import { consolidatedTransactionsQueryKey } from '@/resources/transactions/consolidatedTransactions';
import { queryClient } from '@/react-query/queryClient';
import { getTransactionFlashbotStatus } from '@/handlers/transactions';
import { usePendingTransactionsStore } from '@/state/pendingTransactions';
import { useNonceStore } from '@/state/nonces';
import { Address } from 'viem';
import { nftsQueryKey } from '@/resources/nfts';
import { getNftSortForAddress } from './useNFTsSortBy';
import { ChainId } from '@/chains/types';
import { staleBalancesStore } from '@/state/staleBalances';
import { useConnectedToHardhatStore } from '@/state/connectedToHardhat';
import { SUPPORTED_MAINNET_CHAIN_IDS } from '@/chains';

export const useWatchPendingTransactions = ({ address }: { address: string }) => {
  const { storePendingTransactions, setPendingTransactions } = usePendingTransactionsStore(state => ({
    storePendingTransactions: state.pendingTransactions,
    setPendingTransactions: state.setPendingTransactions,
  }));
  const { connectedToHardhat } = useConnectedToHardhatStore();

  const setNonce = useNonceStore(state => state.setNonce);

  const pendingTransactions = useMemo(() => storePendingTransactions[address] || [], [address, storePendingTransactions]);

  const { nativeCurrency } = useAccountSettings();

  const refreshAssets = useCallback(
    (_: RainbowTransaction) => {
      // NOTE: We have two user assets stores right now, so let's invalidate both queries and trigger a refetch
      queryClient.invalidateQueries(
        userAssetsQueryKey({
          address,
          currency: nativeCurrency,
          testnetMode: connectedToHardhat,
        })
      );
      queryClient.invalidateQueries(nftsQueryKey({ address, sortBy: getNftSortForAddress(address) }));
    },
    [address, connectedToHardhat, nativeCurrency]
  );

  const processFlashbotsTransaction = useCallback(async (tx: RainbowTransaction): Promise<RainbowTransaction> => {
    const flashbotsTxStatus = await getTransactionFlashbotStatus(tx, tx.hash!);
    if (flashbotsTxStatus) {
      const { flashbotsStatus, status, minedAt, title } = flashbotsTxStatus;

      return {
        ...tx,
        status,
        minedAt,
        title,
        flashbotsStatus,
      } as RainbowTransaction;
    }
    return tx;
  }, []);

  const processSupportedNetworkTransaction = useCallback(
    async (tx: RainbowTransaction) => {
      const transaction = await transactionFetchQuery({
        hash: tx.hash!,
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
          // if flashbots tx and no blockNumber, check if it failed
          if (!(tx as any).blockNumber && tx.flashbots) {
            updatedTransaction = await processFlashbotsTransaction(updatedTransaction);
          }
        } else {
          throw new Error('Pending transaction missing chain id');
        }
      } catch (e) {
        logger.error(new RainbowError(`[useWatchPendingTransaction]: Failed to watch transaction`), {
          message: (e as Error)?.message || 'Unknown error',
        });
      }

      if (updatedTransaction?.status !== 'pending') {
        refreshAssets(tx);
      }
      return updatedTransaction;
    },
    [address, processSupportedNetworkTransaction, processFlashbotsTransaction, refreshAssets]
  );

  const processNonces = useCallback(
    (txs: RainbowTransaction[]) => {
      const userTxs = txs.filter(tx => address?.toLowerCase() === tx.from?.toLowerCase());
      const chainIds = [
        ...new Set(
          userTxs.reduce((acc, tx) => {
            acc.add(tx.chainId);
            return acc;
          }, new Set<ChainId>())
        ),
      ];
      let flashbotsTxFailed = false;
      const highestNoncePerChainId = userTxs.reduce((acc, tx) => {
        // if tx is not on mainnet, we don't care about the nonce
        if (tx.chainId !== ChainId.mainnet) {
          acc.set(tx.chainId, tx.nonce);
          return acc;
        }
        // if tx is flashbots and failed, we want to use the lowest nonce
        if (tx.flashbots && (tx as any)?.flashbotsStatus === 'FAILED' && tx?.nonce) {
          // if we already have a failed flashbots tx, we want to use the lowest nonce
          if (flashbotsTxFailed && tx.nonce < acc.get(tx.chainId)) {
            acc.set(tx.chainId, tx.nonce);
          } else {
            acc.set(tx.chainId, tx.nonce);
            flashbotsTxFailed = true;
          }
          // if tx succeeded, we want to use the highest nonce
        } else if (!flashbotsTxFailed && tx?.nonce && tx.nonce > acc.get(tx.chainId)) {
          acc.set(tx.chainId, tx.nonce);
        }
        return acc;
      }, new Map());

      chainIds.map(async chainId => {
        const provider = getProvider({ chainId });
        const providerTransactionCount = await provider.getTransactionCount(address, 'latest');
        const currentProviderNonce = providerTransactionCount - 1;
        const currentNonceForChainId = highestNoncePerChainId.get(chainId) - 1;

        setNonce({
          address,
          chainId,
          currentNonce: currentProviderNonce > currentNonceForChainId ? currentProviderNonce : currentNonceForChainId,
          latestConfirmedNonce: currentProviderNonce,
        });
      });
    },
    [address, setNonce]
  );

  const watchPendingTransactions = useCallback(async () => {
    if (!pendingTransactions?.length) return;
    const updatedPendingTransactions = await Promise.all(
      pendingTransactions.map((tx: RainbowTransaction) => processPendingTransaction(tx))
    );

    processNonces(updatedPendingTransactions);

    const { newPendingTransactions, minedTransactions } = updatedPendingTransactions.reduce(
      (acc, tx) => {
        if (tx?.status === 'pending') {
          acc.newPendingTransactions.push(tx);
        } else {
          acc.minedTransactions.push(tx as MinedTransaction);
        }
        return acc;
      },
      {
        newPendingTransactions: [] as RainbowTransaction[],
        minedTransactions: [] as MinedTransaction[],
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
        queryKey: userAssetsQueryKey({ address, currency: nativeCurrency, testnetMode: connectedToHardhat }),
      });

      await queryClient.refetchQueries({
        queryKey: consolidatedTransactionsQueryKey({
          address,
          currency: nativeCurrency,
          chainIds: SUPPORTED_MAINNET_CHAIN_IDS,
        }),
      });

      // in case balances are not updated immediately lets refetch a couple seconds later
      setTimeout(() => {
        queryClient.refetchQueries({
          queryKey: consolidatedTransactionsQueryKey({
            address,
            currency: nativeCurrency,
            chainIds: SUPPORTED_MAINNET_CHAIN_IDS,
          }),
        });
      }, 2000);
    }
    setPendingTransactions({
      address,
      pendingTransactions: newPendingTransactions,
    });
  }, [address, connectedToHardhat, nativeCurrency, pendingTransactions, processNonces, processPendingTransaction, setPendingTransactions]);

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
