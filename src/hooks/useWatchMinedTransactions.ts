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

const L = (msg: string, extra?: Record<string, unknown>) => {
  try {
    if (extra) {
      console.log(`[MINED] ${msg} ${JSON.stringify(extra)}`);
    } else {
      console.log(`[MINED] ${msg}`);
    }
  } catch {
    console.log(`[MINED] ${msg}`);
  }
};
const short = (v?: string | null) => (v && typeof v === 'string' ? (v.length > 12 ? `${v.slice(0, 8)}…${v.slice(-6)}` : v) : 'n/a');
const shortId = (legacyId: string) => {
  const [address, chain] = legacyId.split('_');
  return `${short(address)}_${chain ?? ''}`;
};

async function refetchOtherAssets({ address }: { address: string }) {
  L('refetchOtherAssets:start', { address: short(address) });
  await Promise.all([
    usePositionsStore.getState().fetch(undefined, { force: true }),
    useClaimablesStore.getState().fetch(undefined, { force: true }),
    invalidateAddressNftsQueries(address),
  ]);
  L('refetchOtherAssets:done', { address: short(address) });
}

function updateUserAssets({ address, newAssets, chainIds }: { address: string; newAssets: Record<string, UserAsset>; chainIds: number[] }) {
  const userAssets = filterZeroBalanceAssets(Object.values(newAssets)).sort((a, b) => parseFloat(b.value) - parseFloat(a.value));
  const positionTokenAddresses = usePositionsStore.getState().getPositionTokenAddresses();

  L('updateUserAssets', {
    address: short(address),
    resultCount: Object.keys(newAssets).length,
    filteredCount: userAssets.length,
    chainIds,
  });

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

        L('watchMinedTransactions:start', {
          address: short(address),
          count: minedTransactionsWithPolling.length,
          sample: minedTransactionsWithPolling.slice(0, 3).map(i => ({
            hash: short(i.transaction.hash),
            type: i.transaction.type,
            chainId: i.transaction.chainId,
            pollingMs: Date.now() - i.pollingStartedAt,
          })),
        });

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
              L('watchMinedTransactions:timeout', {
                hash: short(item.transaction.hash),
                type: item.transaction.type,
                chainId: item.transaction.chainId,
                pollingMs: pollingDuration,
              });
            }
            return !isTimedOut;
          })
          .map(item => item.transaction);

        L('watchMinedTransactions:afterTimeoutFilter', {
          remaining: validTransactions.length,
          cleared: minedTransactionsWithPolling.length - validTransactions.length,
        });

        if (!validTransactions.length) {
          L('watchMinedTransactions:clearMined:noValidTxs', { address: short(address) });
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

        // For logging
        const chainIdsWithStaleBalances: number[] = [];
        const allStaleBalanceTokenIds: string[] = [];

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

        L('watchMinedTransactions:query:GetAssetUpdates', {
          address: short(address),
          currency: nativeCurrency,
          chainIdsToFetch,
          expectedCount: expectedUniqueIds.size,
          forcedTokensCount: forcedTokens.length,
          expectedSample: Array.from(expectedUniqueIds)
            .slice(0, 3)
            .map(id => shortId(id)),
          forcedSample: forcedTokens.slice(0, 3).map(t => {
            const [chain, addr] = t.split(':');
            return `${short(addr)}:${chain}`;
          }),
        });

        const assetsResponse = await getPlatformClient().get<GetAssetsResponse>('/assets/GetAssetUpdates', {
          params: {
            currency: nativeCurrency,
            chainIds: chainIdsToFetch.join(','),
            address,
            ...(forcedTokens.length ? { forcedTokens: forcedTokens.join(',') } : {}),
          },
          timeout: time.seconds(20),
        });

        const newAssets = assetsResponse.data.result ?? {};
        L('watchMinedTransactions:queryResult', {
          resultCount: Object.keys(newAssets).length,
        });

        const expectedArr = Array.from(expectedUniqueIds);
        let changedCount = 0;
        const changeSample: { id: string; changed: boolean }[] = [];
        for (const legacyId of expectedArr) {
          const changed = didUserAssetBalanceChange({ legacyTokenId: legacyId, initialUserAssets, newAssets });
          if (changed) changedCount += 1;
          if (changeSample.length < 3) changeSample.push({ id: shortId(legacyId), changed });
        }

        let someExpectedChangesSeen = false;
        const allExpectedChangesSeen = expectedArr.every(legacyTokenId => {
          const didChange = didUserAssetBalanceChange({ legacyTokenId, initialUserAssets, newAssets });
          if (didChange) {
            someExpectedChangesSeen = true;
          }
          return didChange;
        });

        L('watchMinedTransactions:changes', {
          expected: expectedArr.length,
          changed: changedCount,
          allSeen: allExpectedChangesSeen,
          someSeen: someExpectedChangesSeen,
          sample: changeSample,
        });

        // If we saw any expected changes, update the user assets still in the event that we ran into a race condition with the normal asset fetch interval
        // This is a bit of a hack, as this function will continue being called until it times out, but we will be using a different endpoint in the future
        // So this is fine for now
        if (someExpectedChangesSeen) {
          updateUserAssets({ address, newAssets, chainIds: transactionChainIds });
        }

        if (!allExpectedChangesSeen) {
          // Keep polling until timeout
          L('watchMinedTransactions:waitingForMoreChanges');
          return;
        }

        // All expected assets updated
        useMinedTransactionsStore.getState().clearMinedTransactions(address);
        staleBalancesStore.getState().clearExpiredData(address);
        const timeToResolve = now - oldestMinedTransactionTimestamp;

        analytics.track(event.minedTransactionAssetsResolved, {
          timeToResolve,
        });
        L('watchMinedTransactions:resolved', {
          cleared: true,
          timeToResolveMs: timeToResolve,
          chainIds: transactionChainIds,
        });

        await refetchOtherAssets({ address });
      } catch (e) {
        logger.error(new RainbowError('[watchMinedTransactions]: Polling GetAssetUpdates failed', e));
        L('watchMinedTransactions:error', { msg: (e as Error)?.message ?? String(e) });
      }
    },
    [address, nativeCurrency, staleBalances]
  );

  return watchMinedTransactions;
};
