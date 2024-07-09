import { useCallback, useMemo } from 'react';
import useAccountSettings from './useAccountSettings';
import { RainbowTransaction, MinedTransaction } from '@/entities/transactions/transaction';
import { fetchUserAssets } from '@/resources/assets/UserAssetsQuery';
import { transactionFetchQuery } from '@/resources/transactions/transaction';
import { RainbowError, logger } from '@/logger';
import { Network } from '@/networks/types';
import { getProviderForNetwork } from '@/handlers/web3';
import { consolidatedTransactionsQueryKey } from '@/resources/transactions/consolidatedTransactions';
import { RainbowNetworks } from '@/networks';
import { queryClient } from '@/react-query/queryClient';
import { getTransactionFlashbotStatus } from '@/handlers/transactions';
import { usePendingTransactionsStore } from '@/state/pendingTransactions';
import { useNonceStore } from '@/state/nonces';

export const useWatchPendingTransactions = ({ address }: { address: string }) => {
  //const { swapRefreshAssets } = useSwapRefreshAssets();

  const { storePendingTransactions, setPendingTransactions } = usePendingTransactionsStore(state => ({
    storePendingTransactions: state.pendingTransactions,
    setPendingTransactions: state.setPendingTransactions,
  }));

  const setNonce = useNonceStore(state => state.setNonce);

  const pendingTransactions = useMemo(() => storePendingTransactions[address] || [], [address, storePendingTransactions]);

  const { nativeCurrency, accountAddress } = useAccountSettings();

  const refreshAssets = useCallback(
    (tx: RainbowTransaction) => {
      if (tx.type === 'swap') {
        // update swap assets
        //swapRefreshAssets(tx.nonce);
      } else {
        // fetch assets again
        fetchUserAssets({
          address: accountAddress,
          currency: nativeCurrency,
          connectedToHardhat: false,
        });
      }
    },
    [accountAddress, nativeCurrency]
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
        network: tx.network,
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
        if (tx.network && tx.hash && address) {
          updatedTransaction = await processSupportedNetworkTransaction(updatedTransaction);
          // if flashbots tx and no blockNumber, check if it failed
          if (!(tx as any).blockNumber && tx.flashbots) {
            updatedTransaction = await processFlashbotsTransaction(updatedTransaction);
          }
        } else {
          throw new Error('Pending transaction missing chain id');
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        logger.error(new RainbowError(`useWatchPendingTransaction: Failed to watch transaction`), {
          message: e.message,
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
      const networks = [
        ...new Set(
          userTxs.reduce((acc, tx) => {
            acc.add(tx.network);
            return acc;
          }, new Set<Network>())
        ),
      ];
      let flashbotsTxFailed = false;
      const highestNoncePerChainId = userTxs.reduce((acc, tx) => {
        // if tx is not on mainnet, we don't care about the nonce
        if (tx.network !== Network.mainnet) {
          acc.set(tx.network, tx.nonce);
          return acc;
        }
        // if tx is flashbots and failed, we want to use the lowest nonce
        if (tx.flashbots && (tx as any)?.flashbotsStatus === 'FAILED' && tx?.nonce) {
          // if we already have a failed flashbots tx, we want to use the lowest nonce
          if (flashbotsTxFailed && tx.nonce < acc.get(tx.network)) {
            acc.set(tx.network, tx.nonce);
          } else {
            acc.set(tx.network, tx.nonce);
            flashbotsTxFailed = true;
          }
          // if tx succeeded, we want to use the highest nonce
        } else if (!flashbotsTxFailed && tx?.nonce && tx.nonce > acc.get(tx.network)) {
          acc.set(tx.network, tx.nonce);
        }
        return acc;
      }, new Map());

      networks.map(async network => {
        const provider = getProviderForNetwork(network);
        const providerTransactionCount = await provider.getTransactionCount(address, 'latest');
        const currentProviderNonce = providerTransactionCount - 1;
        const currentNonceForChainId = highestNoncePerChainId.get(network) - 1;

        setNonce({
          address,
          network: network,
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
      const chainIds = RainbowNetworks.filter(network => network.enabled && network.networkType !== 'testnet').map(network => network.id);
      await queryClient.refetchQueries({
        queryKey: consolidatedTransactionsQueryKey({
          address: accountAddress,
          currency: nativeCurrency,
          chainIds,
        }),
      });

      // in case balances are not updated immediately lets refetch a couple seconds later
      setTimeout(() => {
        queryClient.refetchQueries({
          queryKey: consolidatedTransactionsQueryKey({
            address: accountAddress,
            currency: nativeCurrency,
            chainIds,
          }),
        });
      }, 2000);
    }
    setPendingTransactions({
      address: accountAddress,
      pendingTransactions: newPendingTransactions,
    });
  }, [accountAddress, nativeCurrency, pendingTransactions, processNonces, processPendingTransaction, setPendingTransactions]);

  return { watchPendingTransactions };
};
