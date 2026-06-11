import { useCallback } from 'react';

import type { Address } from 'viem';

import { analytics } from '@/analytics';
import { event } from '@/analytics/event';
import type { SupportedCurrencyKey } from '@/features/currency/supportedCurrencies';
import { usePositionsStore } from '@/features/positions/stores/positionsStore';
import { useRewardsBalanceStore } from '@/features/rnbw-rewards/stores/rewardsBalanceStore';
import { time } from '@/framework/core/utils/time';
import { logger, RainbowError } from '@/logger';
import { invalidateAddressNftsQueries } from '@/resources/nfts';
import { getPlatformClient } from '@/resources/platform/client';
import { type GetAssetsResponse, type UserAsset } from '@/state/assets/types';
import { userAssetsStore } from '@/state/assets/userAssets';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { filterZeroBalanceAssets, setUserAssets } from '@/state/assets/utils';
import { useAssetUpdatesStore, type AssetUpdateTransaction, type WatchedAssetUpdateTransaction } from '@/state/assetUpdates/assetUpdates';
import { useClaimablesStore } from '@/state/claimables/claimables';
import { staleBalancesStore, type StaleBalancesByChainId } from '@/state/staleBalances';
import { getUniqueId } from '@/utils/ethereumUtils';

const ASSET_DETECTION_TIMEOUT = time.seconds(30);
const EMPTY_ASSETS: Record<string, UserAsset> = {};

export const useWatchAssetUpdates = ({ address }: { address: Address }) => {
  const currency = userAssetsStoreManager(state => state.currency);
  const staleBalances = staleBalancesStore(state => state.staleBalances[address]);

  return useCallback(
    (watchedTransactions: WatchedAssetUpdateTransaction[]) =>
      watchAssetUpdates({
        address,
        currency,
        staleBalances,
        watchedTransactions,
      }),
    [address, currency, staleBalances]
  );
};

/**
 * Checks whether watched transactions changed the balances they touched and
 * updates local assets when they do.
 */
export async function watchAssetUpdates({
  address,
  currency,
  staleBalances,
  watchedTransactions,
}: {
  address: Address;
  currency: SupportedCurrencyKey;
  staleBalances?: StaleBalancesByChainId;
  watchedTransactions: WatchedAssetUpdateTransaction[];
}): Promise<void> {
  if (!address || !watchedTransactions.length) return;

  try {
    const now = Date.now();
    const timedOutHashes: string[] = [];
    const activeWatches = watchedTransactions.filter(watch => {
      const pollingDuration = now - watch.pollingStartedAt;
      const isTimedOut = pollingDuration >= ASSET_DETECTION_TIMEOUT;
      if (!isTimedOut) return true;

      timedOutHashes.push(watch.transaction.hash);

      if (hasMinedAt(watch.transaction)) {
        analytics.track(event.minedTransactionAssetsTimedOut, {
          chainId: watch.transaction.chainId,
          type: watch.transaction.type,
        });
      }

      logger.warn('[watchAssetUpdates]: Timed out waiting for asset updates for transaction', {
        txHash: watch.transaction.hash,
        pollingDuration,
      });

      return false;
    });

    const expectedAssetIds = new Set<string>();
    const watchedChainIds = new Set<number>();
    let someExpectedChangesSeen = false;
    let completedHashes: string[] = [];

    if (activeWatches.length) {
      activeWatches.forEach(watch => {
        watchedChainIds.add(watch.transaction.chainId);

        if (watch.transaction.changes?.length) {
          for (const change of watch.transaction.changes) {
            if (!change?.asset) continue;
            expectedAssetIds.add(change.asset.uniqueId ?? getUniqueId(change.asset.address, change.asset.chainId));
            watchedChainIds.add(change.asset.chainId);
          }

          return;
        }

        const asset = watch.transaction.asset;
        if (!asset) return;

        expectedAssetIds.add(asset.uniqueId ?? getUniqueId(asset.address, asset.chainId));
        watchedChainIds.add(asset.chainId);
      });

      const assetChainIds = Array.from(watchedChainIds);
      const chainIdsWithStaleBalances: number[] = [];
      const staleBalanceTokenIds: string[] = [];

      if (staleBalances) {
        for (const chainId of assetChainIds) {
          const staleBalancesForChain = staleBalances[chainId];
          if (!staleBalancesForChain) continue;

          chainIdsWithStaleBalances.push(chainId);
          for (const staleBalance of Object.values(staleBalancesForChain)) {
            staleBalanceTokenIds.push(`${staleBalance.address}_${chainId}`);
          }
        }
      }

      const chainIdsToFetch = Array.from(new Set([...assetChainIds, ...chainIdsWithStaleBalances]));
      const forcedTokens = [...expectedAssetIds, ...staleBalanceTokenIds].map(tokenId => tokenId.split('_').join(':'));

      const assetsResponse = await getPlatformClient().get<GetAssetsResponse>('/assets/GetAssetUpdates', {
        params: {
          currency,
          chainIds: chainIdsToFetch.join(','),
          address,
          ...(forcedTokens.length ? { forcedTokens: forcedTokens.join(',') } : undefined),
        },
        timeout: time.seconds(20),
      });

      const newAssets = assetsResponse.data.result ?? EMPTY_ASSETS;
      completedHashes = activeWatches.flatMap(watch => {
        let watchSawAnyChange = false;

        const didComplete = Object.entries(watch.baselineQuantitiesByAssetId).every(([assetId, baselineQuantity]) => {
          const didChange = readFetchedRawQuantity(assetId, newAssets) !== baselineQuantity;
          if (didChange) watchSawAnyChange = true;
          return didChange;
        });

        if (watchSawAnyChange) someExpectedChangesSeen = true;
        return didComplete ? [watch.transaction.hash] : [];
      });

      if (someExpectedChangesSeen) {
        updateUserAssets({ address, newAssets, chainIds: assetChainIds });
      }
    }

    const removedHashes = [...timedOutHashes, ...completedHashes];
    if (!removedHashes.length) return;

    useAssetUpdatesStore.getState().removeWatchedTransactions({ address, hashes: removedHashes });
    staleBalancesStore.getState().clearExpiredData(address);

    if (completedHashes.length) {
      const completedHashesSet = new Set(completedHashes);
      const resolvedMinedTransactions = activeWatches.flatMap(watch => {
        if (!completedHashesSet.has(watch.transaction.hash) || !hasMinedAt(watch.transaction)) return [];
        return [watch.transaction];
      });

      if (resolvedMinedTransactions.length) {
        const oldestMinedTransactionTimestamp = Math.min(...resolvedMinedTransactions.map(tx => tx.minedAt)) * 1000;
        analytics.track(event.minedTransactionAssetsResolved, {
          timeToResolve: now - oldestMinedTransactionTimestamp,
        });
      }
    }

    await Promise.all([
      ...(timedOutHashes.length ? [userAssetsStore.getState(address).fetch(undefined, { force: true })] : []),
      refetchOtherAssets({ address }),
    ]);
  } catch (e) {
    logger.error(new RainbowError('[watchAssetUpdates]: Polling GetAssetUpdates failed', e));
  }
}

async function refetchOtherAssets({ address }: { address: Address }) {
  await Promise.all([
    usePositionsStore.getState().fetch(undefined, { force: true }),
    useClaimablesStore.getState().fetch(undefined, { force: true }),
    useRewardsBalanceStore.getState().fetch(undefined, { force: true }),
    invalidateAddressNftsQueries(address),
  ]);
}

function updateUserAssets({
  address,
  newAssets,
  chainIds,
}: {
  address: Address;
  newAssets: Record<string, UserAsset>;
  chainIds: number[];
}) {
  const userAssets = filterZeroBalanceAssets(Object.values(newAssets)).sort((a, b) => parseFloat(b.value) - parseFloat(a.value));
  const positionTokenAddresses = usePositionsStore.getState().getTokenAddresses();

  userAssetsStore.setState(state =>
    setUserAssets({
      address,
      state,
      userAssets,
      positionTokenAddresses,
      chainIdsToUpdate: chainIds,
    })
  );
}

function readFetchedRawQuantity(assetId: string, newAssets: Record<string, UserAsset>) {
  return newAssets[assetId.split('_').join(':')]?.quantity ?? '0';
}

function hasMinedAt(transaction: AssetUpdateTransaction): transaction is AssetUpdateTransaction & { minedAt: number } {
  return typeof transaction.minedAt === 'number';
}
