import { useCallback } from 'react';

import { type ParsedSearchAsset } from '@/__swaps__/types/assets';
import { analytics } from '@/analytics';
import { event } from '@/analytics/event';
import { usePositionsStore } from '@/features/positions/stores/positionsStore';
import { useRewardsBalanceStore } from '@/features/rnbw-rewards/stores/rewardsBalanceStore';
import { convertAmountToRawAmount } from '@/helpers/utilities';
import { logger, RainbowError } from '@/logger';
import { invalidateAddressNftsQueries } from '@/resources/nfts';
import { getPlatformClient } from '@/resources/platform/client';
import { type GetAssetsResponse, type UserAsset } from '@/state/assets/types';
import { userAssetsStore } from '@/state/assets/userAssets';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { filterZeroBalanceAssets, setUserAssets } from '@/state/assets/utils';
import { useClaimablesStore } from '@/state/claimables/claimables';
import {
  useAssetUpdatesStore,
  type AssetUpdateTransaction,
  type WatchedAssetUpdateTransaction,
} from '@/state/minedTransactions/minedTransactions';
import { staleBalancesStore } from '@/state/staleBalances';
import { getUniqueId } from '@/utils/ethereumUtils';
import { time } from '@/utils/time';

const ASSET_DETECTION_TIMEOUT = time.seconds(30);
const EMPTY_ASSETS: Record<string, UserAsset> = {};

/**
 * Returns a watcher for balance changes in the assets affected by settled transactions.
 */
export const useWatchAssetUpdateTransactions = ({ address }: { address: string }) => {
  const nativeCurrency = userAssetsStoreManager(state => state.currency);
  const staleBalances = staleBalancesStore(state => state.staleBalances[address]);

  const watchAssetUpdateTransactions = useCallback(
    async (watchedTransactions: WatchedAssetUpdateTransaction[]) => {
      if (!address) return;
      try {
        if (!watchedTransactions.length) return;

        const initialUserAssets = userAssetsStore.getState().userAssets;
        const now = Date.now();

        const validTransactions = watchedTransactions
          .filter(watch => {
            const pollingDuration = now - watch.pollingStartedAt;
            const isTimedOut = pollingDuration >= ASSET_DETECTION_TIMEOUT;

            if (isTimedOut) {
              if (hasMinedAt(watch.transaction)) {
                analytics.track(event.minedTransactionAssetsTimedOut, {
                  chainId: watch.transaction.chainId,
                  type: watch.transaction.type,
                });
              }

              logger.warn('[watchAssetUpdateTransactions]: Timed out waiting for asset updates for transaction', {
                txHash: watch.transaction.hash,
                pollingDuration,
              });
            }
            return !isTimedOut;
          })
          .map(watch => watch.transaction);

        if (!validTransactions.length) {
          useAssetUpdatesStore.getState().clearWatchedTransactions(address);
          await refetchOtherAssets({ address });
          return;
        }

        const minedTransactions = validTransactions.filter(hasMinedAt);
        const expectedUniqueIds = new Set<string>();
        const transactionChainIds = new Set<number>();

        validTransactions.forEach(transaction => {
          transactionChainIds.add(transaction.chainId);

          if (transaction.changes?.length) {
            transaction.changes.forEach(change => {
              if (!change?.asset) return;
              expectedUniqueIds.add(getUniqueId(change.asset.address, change.asset.chainId));
              transactionChainIds.add(change.asset.chainId);
            });
            return;
          }

          if (!transaction.asset) return;
          expectedUniqueIds.add(getUniqueId(transaction.asset.address, transaction.asset.chainId));
          transactionChainIds.add(transaction.asset.chainId);
        });

        const touchedChainIds = Array.from(transactionChainIds);
        const chainIdsWithStaleBalances = [];
        const allStaleBalanceTokenIds = [];

        if (staleBalances) {
          for (const chainId of touchedChainIds) {
            const staleBalancesForChain = staleBalances[chainId];
            if (staleBalancesForChain) {
              chainIdsWithStaleBalances.push(chainId);
              for (const staleBalance of Object.values(staleBalancesForChain)) {
                allStaleBalanceTokenIds.push(`${staleBalance.address}_${chainId}`);
              }
            }
          }
        }

        const chainIdsToFetch = Array.from(new Set([...touchedChainIds, ...chainIdsWithStaleBalances]));
        const forcedTokens = [...expectedUniqueIds, ...allStaleBalanceTokenIds].map(tokenId => tokenId.split('_').join(':'));

        const assetsResponse = await getPlatformClient().get<GetAssetsResponse>('/assets/GetAssetUpdates', {
          params: {
            currency: nativeCurrency,
            chainIds: chainIdsToFetch.join(','),
            address,
            ...(forcedTokens.length ? { forcedTokens: forcedTokens.join(',') } : undefined),
          },
          timeout: time.seconds(20),
        });

        let someExpectedChangesSeen = false;
        const newAssets = assetsResponse.data.result ?? EMPTY_ASSETS;

        const allExpectedChangesSeen = [...expectedUniqueIds].every(legacyTokenId => {
          const didChange = didUserAssetBalanceChange({ legacyTokenId, initialUserAssets, newAssets });
          if (didChange) {
            someExpectedChangesSeen = true;
          }
          return didChange;
        });

        if (someExpectedChangesSeen) {
          updateUserAssets({ address, newAssets, chainIds: touchedChainIds });
        }

        if (!allExpectedChangesSeen) {
          return;
        }

        useAssetUpdatesStore.getState().clearWatchedTransactions(address);
        staleBalancesStore.getState().clearExpiredData(address);

        if (minedTransactions.length) {
          const oldestMinedTransactionTimestamp = Math.min(...minedTransactions.map(tx => tx.minedAt)) * 1000;
          analytics.track(event.minedTransactionAssetsResolved, {
            timeToResolve: now - oldestMinedTransactionTimestamp,
          });
        }
        await refetchOtherAssets({ address });
      } catch (e) {
        logger.error(new RainbowError('[watchAssetUpdateTransactions]: Polling GetAssetUpdates failed', e));
      }
    },
    [address, nativeCurrency, staleBalances]
  );

  return watchAssetUpdateTransactions;
};

async function refetchOtherAssets({ address }: { address: string }) {
  await Promise.all([
    usePositionsStore.getState().fetch(undefined, { force: true }),
    useClaimablesStore.getState().fetch(undefined, { force: true }),
    useRewardsBalanceStore.getState().fetch(undefined, { force: true }),
    invalidateAddressNftsQueries(address),
  ]);
}

function updateUserAssets({ address, newAssets, chainIds }: { address: string; newAssets: Record<string, UserAsset>; chainIds: number[] }) {
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

function didUserAssetBalanceChange({
  legacyTokenId,
  initialUserAssets,
  newAssets,
}: {
  legacyTokenId: string;
  initialUserAssets: Map<string, ParsedSearchAsset>;
  newAssets: Record<string, UserAsset>;
}) {
  const initialAsset = initialUserAssets.get(legacyTokenId);
  const tokenId = legacyTokenId.split('_').join(':');
  const newAssetQuantity = newAssets[tokenId]?.quantity;
  const initialAssetQuantity = convertAmountToRawAmount(initialAsset?.balance.amount ?? '0', initialAsset?.decimals ?? 18);
  return initialAssetQuantity !== newAssetQuantity;
}

function hasMinedAt(transaction: AssetUpdateTransaction): transaction is AssetUpdateTransaction & { minedAt: number } {
  return typeof transaction.minedAt === 'number';
}
