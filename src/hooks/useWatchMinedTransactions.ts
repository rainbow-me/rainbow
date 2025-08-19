import { useCallback } from 'react';
import { MinedTransaction } from '@/entities';
import { RainbowError, logger } from '@/logger';
import { invalidateAddressNftsQueries } from '@/resources/nfts';
import { userAssetsStore } from '@/state/assets/userAssets';
import { getPlatformClient } from '@/resources/platform/client';
import { GetAssetsResponse } from '@/state/assets/types';
import { time } from '@/utils/time';
import { getUniqueId } from '@/utils/ethereumUtils';
import { usePositionsStore } from '@/state/positions/positions';
import { useClaimablesStore } from '@/state/claimables/claimables';
import { analytics } from '@/analytics';
import { event } from '@/analytics/event';
import { useMinedTransactionsStore } from '@/state/minedTransactions/minedTransactions';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { convertAmountToRawAmount, greaterThan } from '@/helpers/utilities';
import { toUnixTime } from '@/worklets/dates';
import { setUserAssets } from '@/state/assets/utils';

const ASSET_DETECTION_TIMEOUT = toUnixTime(time.seconds(30));

async function refetchOtherAssets({ address }: { address: string }) {
  await Promise.all([
    usePositionsStore.getState().fetch(undefined, { force: true }),
    useClaimablesStore.getState().fetch(undefined, { force: true }),
    invalidateAddressNftsQueries(address),
  ]);
}

export const useWatchMinedTransactions = ({ address }: { address: string }) => {
  const nativeCurrency = userAssetsStoreManager(state => state.currency);
  const clearMinedTransactions = useMinedTransactionsStore(state => state.clearMinedTransactions);

  const watchMinedTransactions = useCallback(
    async (minedTransactions: MinedTransaction[]): Promise<boolean> => {
      if (!minedTransactions.length) return false;

      const initialUserAssets = userAssetsStore.getState().userAssets;
      const now = Math.floor(Date.now() / 1000);
      const transactionsToWatch = minedTransactions.filter(tx => tx.changes?.length || tx.asset);

      const validTransactions = transactionsToWatch.filter(tx => {
        const timestamp = tx.timestamp ? Math.round(tx.timestamp / 1000) : tx.minedAt;
        const isTimedOut = now - timestamp >= ASSET_DETECTION_TIMEOUT;
        if (isTimedOut) {
          analytics.track(event.minedTransactionAssetsTimedOut, {
            chainId: tx.chainId,
            type: tx.type,
          });
          logger.warn('[watchMinedTransactions]: Timed out waiting for asset updates for transaction', {
            txHash: tx.hash,
          });
        }
        return !isTimedOut;
      });

      if (!validTransactions.length) {
        clearMinedTransactions(address);
        return false;
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

      try {
        const assetsResponse = await getPlatformClient().get<GetAssetsResponse>('/assets/GetAssetUpdates', {
          params: {
            currency: nativeCurrency,
            chainIds: transactionChainIds.join(','),
            address,
          },
          timeout: time.seconds(20),
        });

        const newAssets = assetsResponse.data.result ?? {};
        const allExpectedChangesSeen = [...expectedUniqueIds].every(legacyTokenId => {
          const initialAsset = initialUserAssets.get(legacyTokenId);
          const tokenId = legacyTokenId.split('_').join(':');
          const newAssetQuantity = newAssets[tokenId]?.quantity;
          const initialAssetQuantity = convertAmountToRawAmount(initialAsset?.balance.amount ?? '0', initialAsset?.decimals ?? 18);
          return initialAssetQuantity !== newAssetQuantity;
        });

        if (!allExpectedChangesSeen) {
          return true;
        }

        // Filter out zero balance assets and sort by value
        const userAssets = Object.values(newAssets)
          .filter(asset => greaterThan(asset.value, 0))
          .sort((a, b) => parseFloat(b.value) - parseFloat(a.value));

        // Merge the chain-specific assets with existing assets
        const positionTokenAddresses = usePositionsStore.getState().getPositionTokenAddresses();
        userAssetsStore.setState(state =>
          setUserAssets({
            address,
            state,
            userAssets,
            positionTokenAddresses,
            chainIdsToUpdate: transactionChainIds,
          })
        );

        await refetchOtherAssets({ address });

        analytics.track(event.minedTransactionAssetsResolved, {
          timeToResolve: now * 1000 - oldestMinedTransactionTimestamp,
        });
        clearMinedTransactions(address);
        return false;
      } catch (e) {
        logger.error(new RainbowError('[watchMinedTransactions]: Polling GetAssetUpdates failed', e));
        return true;
      }
    },
    [address, nativeCurrency, clearMinedTransactions]
  );

  return {
    watchMinedTransactions,
  };
};
