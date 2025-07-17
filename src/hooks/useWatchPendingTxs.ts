import { useMemo, useCallback, useState } from 'react';
import { RainbowTransaction, MinedTransaction, TransactionStatus } from '@/entities';
import { transactionFetchQuery } from '@/resources/transactions/transaction';
import { RainbowError, logger } from '@/logger';
import { consolidatedTransactionsQueryKey } from '@/resources/transactions/consolidatedTransactions';
import { queryClient } from '@/react-query/queryClient';
import { invalidateAddressNftsQueries } from '@/resources/nfts';
import { usePendingTransactionsStore } from '@/state/pendingTransactions';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { userAssetsStore } from '@/state/assets/userAssets';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { getPlatformClient } from '@/resources/platform/client';
import { GetAssetsResponse, UserAsset } from '@/state/assets/types';
import { SupportedCurrencyKey } from '@/references';
import { time } from '@/utils/time';
import { getUniqueId } from '@/utils/ethereumUtils';

const ASSET_DETECTION_TIMEOUT = time.seconds(30) / 1000;

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

async function refetchUserAssets({ address }: { address: string }) {
  // TODO: add claimables and positions here
  await Promise.all([userAssetsStore.getState().fetch(undefined, { force: true }), invalidateAddressNftsQueries(address)]);
}

export const useWatchPendingTransactions = ({ address }: { address: string }) => {
  const nativeCurrency = userAssetsStoreManager(state => state.currency);
  const pendingTransactionsByAddress = usePendingTransactionsStore(state => state.pendingTransactions);
  const pendingTransactions = useMemo(() => pendingTransactionsByAddress[address] || [], [address, pendingTransactionsByAddress]);

  // Mined transactions we're waiting for asset changes for
  const [waitingMinedTransactions, setWaitingMinedTransactions] = useState<MinedTransaction[]>([]);

  const watchPendingTransactions = useCallback(async () => {
    if (!pendingTransactions.length && !waitingMinedTransactions.length) return;

    let newlyMinedTransactions: MinedTransaction[] = [];

    if (pendingTransactions.length) {
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
          }
          return acc;
        },
        {
          newPendingTransactions: [],
          minedTransactions: [],
        }
      );

      newlyMinedTransactions = minedTransactions;

      usePendingTransactionsStore.getState().setPendingTransactions({
        address,
        pendingTransactions: newPendingTransactions,
      });

      // TODO: We should implement similar polling logic for fetching this until we get the tx hashes we're expecting
      if (minedTransactions.length) {
        // TODO: Only need to fetch for the chains that the mined transactions are on
        const supportedMainnetChainIds = useBackendNetworksStore.getState().getSupportedMainnetChainIds();

        await queryClient.refetchQueries({
          queryKey: consolidatedTransactionsQueryKey({
            address,
            currency: nativeCurrency,
            chainIds: supportedMainnetChainIds,
          }),
        });
      }
    }

    const allExistingHashes = new Set(waitingMinedTransactions.map(tx => tx.hash));
    const newWaiting = newlyMinedTransactions.filter(tx => (tx.changes?.length || tx.asset) && !allExistingHashes.has(tx.hash));

    // Remove timed out waiting transactions
    const now = Math.floor(Date.now() / 1000);
    const validWaitingMindedTransactions = waitingMinedTransactions.filter(tx => now - tx.minedAt < ASSET_DETECTION_TIMEOUT);

    if (validWaitingMindedTransactions.length < waitingMinedTransactions.length) {
      waitingMinedTransactions.forEach(tx => {
        if (now - tx.minedAt >= ASSET_DETECTION_TIMEOUT) {
          logger.warn(`[watchPendingTransactions]: Timed out waiting for asset updates for transaction ${tx.hash}`);
        }
      });
    }

    const updatedWaitingMinedTransactions = [...validWaitingMindedTransactions, ...newWaiting];

    if (updatedWaitingMinedTransactions.length) {
      const expectedUniqueIds = new Set<string>();
      updatedWaitingMinedTransactions.forEach(tx => {
        if (tx.changes?.length) {
          tx.changes.forEach(change => {
            if (change?.asset) {
              expectedUniqueIds.add(getUniqueId(change.asset.address, change.asset.chainId));
            }
          });
        } else if (tx.asset) {
          expectedUniqueIds.add(getUniqueId(tx.asset.address, tx.asset.chainId));
        }
      });

      const oldestMinedTransactionTimestamp = Math.min(...updatedWaitingMinedTransactions.map(tx => tx.minedAt)) * 1000;
      const transactionChainIds = Array.from(new Set(updatedWaitingMinedTransactions.map(tx => tx.chainId)));

      try {
        const assetsUpdateResult = await getPlatformClient().get<GetAssetsResponse>('/assets/GetAssetUpdates', {
          params: {
            currency: nativeCurrency,
            chainIds: transactionChainIds.join(','),
            address,
            timestamp: new Date(oldestMinedTransactionTimestamp).toISOString(),
          },
          timeout: time.seconds(20),
        });

        const assetsMap: Record<string, UserAsset> = assetsUpdateResult.data.result;
        // unique id -> legacy unique id
        const updatedUniqueIds = Object.keys(assetsMap).map(id => id.split(':').join('_'));

        const allExpectedUniqueIdsSeen = expectedUniqueIds.size === 0 || [...expectedUniqueIds].every(id => updatedUniqueIds.includes(id));

        if (allExpectedUniqueIdsSeen) {
          refetchUserAssets({ address });
          setWaitingMinedTransactions([]);
          return;
        }
      } catch (e) {
        logger.error(new RainbowError('[watchPendingTransactions]: Polling GetAssetUpdates failed', e));
      }
    }

    setWaitingMinedTransactions(updatedWaitingMinedTransactions);
  }, [address, nativeCurrency, pendingTransactions, waitingMinedTransactions]);

  return { watchPendingTransactions };
};
