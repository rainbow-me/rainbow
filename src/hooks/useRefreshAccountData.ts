import { analytics } from '@/analytics';
import { logger, RainbowError } from '@/logger';
import { createQueryKey, queryClient } from '@/react-query';
import { userAssetsStore } from '@/state/assets/userAssets';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { useClaimablesStore } from '@/state/claimables/claimables';
import { usePositionsStore } from '@/state/positions/positions';
import { refetchWalletSummary } from '@/state/wallets/useWalletSummaryStore';
import { getAccountAddress, refreshWalletInfo } from '@/state/wallets/walletsStore';
import { time } from '@/utils';
import delay from 'delay';
import { useCallback, useState } from 'react';
import { useNftsStore } from '@/state/nfts/nfts';
import { PAGE_SIZE } from '@/state/nfts/createNftsStore';
import { hiddenTokensQueryKey } from '@/hooks/useFetchHiddenTokens';
import { showcaseTokensQueryKey } from '@/hooks/useFetchShowcaseTokens';

// minimum duration we want the "Pull to Refresh" animation to last
const MIN_REFRESH_DURATION = 1_250;

export const refreshAccountData = async () => {
  const accountAddress = getAccountAddress();

  // These queries can take too long to fetch, so we do not wait for them
  refetchWalletSummary();
  queryClient.invalidateQueries(createQueryKey('nfts', { address: accountAddress }));
  queryClient.invalidateQueries(showcaseTokensQueryKey({ address: accountAddress }));
  queryClient.invalidateQueries(hiddenTokensQueryKey({ address: accountAddress }));

  await Promise.all([
    delay(MIN_REFRESH_DURATION),
    refreshWalletInfo({ addresses: [accountAddress] }),
    userAssetsStore.getState().fetch(undefined, { staleTime: 0 }),
    useBackendNetworksStore.getState().fetch(undefined, { staleTime: time.seconds(30) }),
    usePositionsStore.getState().fetch(undefined, { staleTime: time.seconds(5) }),
    useClaimablesStore.getState().fetch(undefined, { staleTime: time.seconds(5) }),
    useNftsStore.getState().fetch({ limit: PAGE_SIZE }, { staleTime: time.seconds(5) }),
  ]).then(() => refreshWalletInfo({ useCachedENS: true }));
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
