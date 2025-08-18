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
import { convertAmountToRawAmount } from '@/helpers/utilities';
import { toUnixTime } from '@/worklets/dates';

const ASSET_DETECTION_TIMEOUT = toUnixTime(time.seconds(60));

async function refetchUserAssets({ address }: { address: string }) {
  await Promise.all([
    userAssetsStore.getState().fetch(undefined, { force: true }),
    usePositionsStore.getState().fetch(undefined, { force: true }),
    useClaimablesStore.getState().fetch(undefined, { force: true }),
    invalidateAddressNftsQueries(address),
  ]);
}

export const useWatchMinedTransactions = ({ address }: { address: string }) => {
  const nativeCurrency = userAssetsStoreManager(state => state.currency);
  const clearMinedTransactions = useMinedTransactionsStore(state => state.clearMinedTransactions);

  const watchMinedTransactions = useCallback(
    async (minedTransactions: MinedTransaction[]) => {
      if (!minedTransactions.length) return;

      const initialUserAssets = userAssetsStore.getState().userAssets ?? {};
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

        if (!allExpectedChangesSeen) return;

        analytics.track(event.minedTransactionAssetsResolved, {
          timeToResolve: now * 1000 - oldestMinedTransactionTimestamp,
        });
        refetchUserAssets({ address });
        clearMinedTransactions(address);
      } catch (e) {
        logger.error(new RainbowError('[watchMinedTransactions]: Polling GetAssetUpdates failed', e));
      }
    },
    [address, nativeCurrency, clearMinedTransactions]
  );

  return {
    watchMinedTransactions,
  };
};
