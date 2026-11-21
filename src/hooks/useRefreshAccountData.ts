import { useCallback, useState } from 'react';

import delay from 'delay';

import { analytics } from '@/analytics';
import { useBackendNetworksStore } from '@/features/network/stores/backendNetworksStore';
import { fetchHiddenTokens } from '@/features/nfts/data/hiddenNftsStore';
import { fetchShowcaseTokens } from '@/features/nfts/data/showcaseStore';
import { hyperliquidAccountActions } from '@/features/perps/stores/hyperliquidAccountStore';
import { usePolymarketBalanceStore } from '@/features/polymarket/stores/polymarketBalanceStore';
import { usePolymarketPositionsStore } from '@/features/polymarket/stores/polymarketPositionsStore';
import { usePositionsStore } from '@/features/positions/stores/positionsStore';
import { time } from '@/framework/core/utils/time';
import { logger, RainbowError } from '@/logger';
import { createQueryKey, queryClient } from '@/react-query';
import { userAssetsActions } from '@/state/assets/userAssets';
import { useClaimablesStore } from '@/state/claimables/claimables';
import { nftsActions } from '@/state/nfts/nfts';
import { refetchWalletSummary } from '@/state/wallets/useWalletSummaryStore';
import { getAccountAddress, refreshWalletInfo } from '@/state/wallets/walletsStore';

// minimum duration we want the "Pull to Refresh" animation to last
const MIN_REFRESH_DURATION = 1_250;

export const refreshAccountData = async () => {
  const accountAddress = getAccountAddress();

  // These queries can take too long to fetch, so we do not wait for them
  refetchWalletSummary();
  queryClient.invalidateQueries(createQueryKey('nfts', { address: accountAddress }));
  void fetchShowcaseTokens({ address: accountAddress }, { force: true });
  void fetchHiddenTokens({ address: accountAddress }, { force: true });

  const requests: Promise<unknown>[] = [
    delay(MIN_REFRESH_DURATION),
    refreshWalletInfo({ addresses: [accountAddress] }),
    hyperliquidAccountActions.fetch(undefined, { force: true }),
    userAssetsActions.fetch(undefined, { staleTime: 0 }),
    usePolymarketPositionsStore.getState().fetch(undefined, { staleTime: time.seconds(2) }),
    usePolymarketBalanceStore.getState().fetch(undefined, { staleTime: 0 }),
    useBackendNetworksStore.getState().fetch(undefined, { staleTime: time.seconds(30) }),
    usePositionsStore.getState().fetch(undefined, { staleTime: time.seconds(5) }),
    useClaimablesStore.getState().fetch(undefined, { staleTime: time.seconds(5) }),
    nftsActions.refresh(),
  ];

  await Promise.allSettled(requests);
  await refreshWalletInfo({ useCachedENS: true });
};

export default function useRefreshAccountData() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);

    try {
      const start = performance.now();
      await refreshAccountData();
      analytics.track(analytics.event.refreshAccountData, {
        duration: performance.now() - start,
      });
    } catch (error) {
      logger.error(new RainbowError(`[useRefreshAccountData]: Error calling fetchAccountData`, error));
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  return {
    isRefreshing,
    refresh,
  };
}
