import { useMemo, useCallback, useState } from 'react';
import { RainbowTransaction, MinedTransaction, TransactionStatus } from '@/entities';
import { transactionFetchQuery } from '@/resources/transactions/transaction';
import { RainbowError, logger } from '@/logger';
import { fetchConsolidatedTransactions } from '@/resources/transactions/consolidatedTransactions';
import { invalidateAddressNftsQueries } from '@/resources/nfts';
import { usePendingTransactionsStore } from '@/state/pendingTransactions';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { userAssetsStore } from '@/state/assets/userAssets';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { getPlatformClient } from '@/resources/platform/client';
import { GetAssetsResponse } from '@/state/assets/types';
import { SupportedCurrencyKey } from '@/references';
import { time } from '@/utils/time';
import { getUniqueId } from '@/utils/ethereumUtils';
import { usePositionsStore } from '@/state/positions/positions';
import { useClaimablesStore } from '@/state/claimables/claimables';
import { analytics } from '@/analytics';
import { event } from '@/analytics/event';

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
  await Promise.all([
    userAssetsStore.getState().fetch(undefined, { force: true }),
    usePositionsStore.getState().fetch(undefined, { force: true }),
    useClaimablesStore.getState().fetch(undefined, { force: true }),
    invalidateAddressNftsQueries(address),
  ]);
}

export const useWatchPendingTransactions = ({ address }: { address: string }) => {
  const nativeCurrency = userAssetsStoreManager(state => state.currency);
  const pendingTransactionsByAddress = usePendingTransactionsStore(state => state.pendingTransactions);
  const pendingTransactions = useMemo(() => pendingTransactionsByAddress[address] || [], [address, pendingTransactionsByAddress]);

  // Mined transactions we're waiting for asset changes for
  const [waitingMinedTransactions, setWaitingMinedTransactions] = useState<MinedTransaction[]>([]);

  const watchPendingTransactions = useCallback(async () => {
    if (!pendingTransactions.length && !waitingMinedTransactions.length) return;
    const now = Math.floor(Date.now() / 1000);
    const allChainIds = useBackendNetworksStore.getState().getSupportedMainnetChainIds();

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
      newlyMinedTransactions = minedTransactions;

      usePendingTransactionsStore.getState().setPendingTransactions({
        address,
        pendingTransactions: newPendingTransactions,
      });

      if (minedTransactions.length) {
        await fetchConsolidatedTransactions(
          {
            address,
            currency: nativeCurrency,
            chainIds: allChainIds,
          },
          {
            staleTime: 0,
          }
        );
      }
    }

    const allExistingHashes = new Set(waitingMinedTransactions.map(tx => tx.hash));
    const newWaiting = newlyMinedTransactions.filter(tx => (tx.changes?.length || tx.asset) && !allExistingHashes.has(tx.hash));

    // Remove timed out waiting transactions
    const validWaitingMinedTransactions = waitingMinedTransactions.filter(tx => now - tx.minedAt < ASSET_DETECTION_TIMEOUT);

    if (validWaitingMinedTransactions.length < waitingMinedTransactions.length) {
      waitingMinedTransactions.forEach(tx => {
        if (now - tx.minedAt >= ASSET_DETECTION_TIMEOUT) {
          analytics.track(event.minedTransactionAssetsTimedOut, {
            chainId: tx.chainId,
            type: tx.type,
          });
          logger.warn('[watchPendingTransactions]: Timed out waiting for asset updates for transaction', {
            txHash: tx.hash,
          });
        }
      });
    }

    const updatedWaitingMinedTransactions = [...validWaitingMinedTransactions, ...newWaiting];

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
        const assetsMap = assetsUpdateResult.data.result ?? {};

        // unique id -> legacy unique id
        const updatedUniqueIds = Object.keys(assetsMap).map(id => id.split(':').join('_'));
        const allExpectedUniqueIdsSeen = expectedUniqueIds.size === 0 || [...expectedUniqueIds].every(id => updatedUniqueIds.includes(id));

        if (allExpectedUniqueIdsSeen) {
          analytics.track(event.minedTransactionAssetsResolved, {
            timeToResolve: now * 1000 - oldestMinedTransactionTimestamp,
          });
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
