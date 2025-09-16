import { useCallback } from 'react';
import { RainbowError, logger } from '@/logger';
import { invalidateAddressNftsQueries } from '@/resources/nfts';
import { userAssetsStore } from '@/state/assets/userAssets';
import { getPlatformClient } from '@/resources/platform/client';
import { GetAssetsResponse, UserAsset } from '@/state/assets/types';
import { time } from '@/utils/time';
import { getUniqueId } from '@/utils/ethereumUtils';
import { usePositionsStore } from '@/state/positions/positions';
import { useClaimablesStore } from '@/state/claimables/claimables';
import { analytics } from '@/analytics';
import { event } from '@/analytics/event';
import { useMinedTransactionsStore, MinedTransactionWithPolling } from '@/state/minedTransactions/minedTransactions';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { convertAmountToRawAmount } from '@/helpers/utilities';
import { filterZeroBalanceAssets, setUserAssets } from '@/state/assets/utils';
import { staleBalancesStore } from '@/state/staleBalances';
import { ParsedSearchAsset } from '@/__swaps__/types/assets';

const ASSET_DETECTION_TIMEOUT = time.seconds(30);

async function refetchOtherAssets({ address }: { address: string }) {
  await Promise.all([
    usePositionsStore.getState().fetch(undefined, { force: true }),
    useClaimablesStore.getState().fetch(undefined, { force: true }),
    invalidateAddressNftsQueries(address),
  ]);
}

function updateUserAssets({ address, newAssets, chainIds }: { address: string; newAssets: Record<string, UserAsset>; chainIds: number[] }) {
  const userAssets = filterZeroBalanceAssets(Object.values(newAssets)).sort((a, b) => parseFloat(b.value) - parseFloat(a.value));
  const positionTokenAddresses = usePositionsStore.getState().getPositionTokenAddresses();

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

export const useWatchMinedTransactions = ({ address }: { address: string }) => {
  const nativeCurrency = userAssetsStoreManager(state => state.currency);
  const staleBalances = staleBalancesStore(state => state.staleBalances[address]);

  const watchMinedTransactions = useCallback(
    async (minedTransactionsWithPolling: MinedTransactionWithPolling[]) => {
      try {
        if (!minedTransactionsWithPolling.length) return;

        const initialUserAssets = userAssetsStore.getState().userAssets;
        const now = Date.now();

        const validTransactions = minedTransactionsWithPolling
          .filter(item => {
            const pollingDuration = now - item.pollingStartedAt;
            const isTimedOut = pollingDuration >= ASSET_DETECTION_TIMEOUT;
            if (isTimedOut) {
              analytics.track(event.minedTransactionAssetsTimedOut, {
                chainId: item.transaction.chainId,
                type: item.transaction.type,
              });
              logger.warn('[watchMinedTransactions]: Timed out waiting for asset updates for transaction', {
                txHash: item.transaction.hash,
                pollingDuration,
              });
            }
            return !isTimedOut;
          })
          .map(item => item.transaction);

        if (!validTransactions.length) {
          useMinedTransactionsStore.getState().clearMinedTransactions(address);
          await refetchOtherAssets({ address });
          return;
        }

        const expectedUniqueIds = new Set<string>();
        validTransactions.forEach(tx => {
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

        const oldestMinedTransactionTimestamp = Math.min(...validTransactions.map(tx => tx.minedAt)) * 1000;
        const transactionChainIds = Array.from(new Set(validTransactions.map(tx => tx.chainId)));
        const chainIdsWithStaleBalances = [];
        const allStaleBalanceTokenIds = [];

        if (staleBalances) {
          for (const chainId of transactionChainIds) {
            const staleBalancesForChain = staleBalances[chainId];
            if (staleBalancesForChain) {
              chainIdsWithStaleBalances.push(chainId);
              for (const staleBalance of Object.values(staleBalancesForChain)) {
                allStaleBalanceTokenIds.push(`${staleBalance.address}_${chainId}`);
              }
            }
          }
        }

        const chainIdsToFetch = Array.from(new Set([...transactionChainIds, ...chainIdsWithStaleBalances]));
        const forcedTokens = [...expectedUniqueIds, ...allStaleBalanceTokenIds].map(tokenId => tokenId.split('_').join(':'));

        const assetsResponse = await getPlatformClient().get<GetAssetsResponse>('/assets/GetAssetUpdates', {
          params: {
            currency: nativeCurrency,
            chainIds: chainIdsToFetch.join(','),
            address,
            ...(forcedTokens.length ? { forcedTokens: forcedTokens.join(',') } : {}),
          },
          timeout: time.seconds(20),
        });

        let someExpectedChangesSeen = false;
        const newAssets = assetsResponse.data.result ?? {};
        const allExpectedChangesSeen = [...expectedUniqueIds].every(legacyTokenId => {
          const didChange = didUserAssetBalanceChange({ legacyTokenId, initialUserAssets, newAssets });
          if (didChange) {
            someExpectedChangesSeen = true;
          }
          return didChange;
        });

        // If we saw any expected changes, update the user assets still in the event that we ran into a race condition with the normal asset fetch interval
        // This is a bit of a hack, as this function will continue being called until it times out, but we will be using a different endpoint in the future
        // So this is fine for now
        if (someExpectedChangesSeen) {
          updateUserAssets({ address, newAssets, chainIds: transactionChainIds });
        }

        if (!allExpectedChangesSeen) {
          return;
        }

        useMinedTransactionsStore.getState().clearMinedTransactions(address);
        staleBalancesStore.getState().clearExpiredData(address);
        analytics.track(event.minedTransactionAssetsResolved, {
          timeToResolve: now - oldestMinedTransactionTimestamp,
        });
        await refetchOtherAssets({ address });
      } catch (e) {
        logger.error(new RainbowError('[watchMinedTransactions]: Polling GetAssetUpdates failed', e));
      }
    },
    [address, nativeCurrency, staleBalances]
  );

  return watchMinedTransactions;
};
