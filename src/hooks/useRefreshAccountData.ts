import { analytics } from '@/analytics';
import { PROFILES, useExperimentalFlag } from '@/config';
import { logger, RainbowError } from '@/logger';
import { userAssetsStore } from '@/state/assets/userAssets';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { useClaimablesStore } from '@/state/claimables/claimables';
import { usePositionsStore } from '@/state/positions/positions';
import { refreshWalletENSAvatars, refreshWalletNames, useAccountAddress } from '@/state/wallets/walletsStore';
import { time } from '@/utils';
import delay from 'delay';
import { useCallback, useState } from 'react';
import { createQueryKey, queryClient } from '@/react-query';
import { refetchAddysSummary } from '@/resources/addys/summary';

// minimum duration we want the "Pull to Refresh" animation to last
const MIN_REFRESH_DURATION = 1_250;

export default function useRefreshAccountData() {
  const accountAddress = useAccountAddress();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const profilesEnabled = useExperimentalFlag(PROFILES);

  const fetchAccountData = useCallback(async () => {
    const getWalletENSAvatars = profilesEnabled ? refreshWalletENSAvatars() : null;

    // These queries can take too long to fetch, so we do not wait for them
    refetchAddysSummary();
    queryClient.invalidateQueries([createQueryKey('nfts', { address: accountAddress })]);

    await Promise.all([
      delay(MIN_REFRESH_DURATION),
      refreshWalletNames(),
      getWalletENSAvatars,
      userAssetsStore.getState().fetch(undefined, { staleTime: 0 }),
      useBackendNetworksStore.getState().fetch(undefined, { staleTime: time.seconds(30) }),
      usePositionsStore.getState().fetch(undefined, { staleTime: time.seconds(5) }),
      useClaimablesStore.getState().fetch(undefined, { staleTime: time.seconds(5) }),
    ]);
  }, [accountAddress, profilesEnabled]);

  const refresh = useCallback(async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);

    try {
      const start = performance.now();
      await fetchAccountData();
      analytics.track(analytics.event.refreshAccountData, {
        duration: performance.now() - start,
      });
    } catch (error) {
      logger.error(new RainbowError(`[useRefreshAccountData]: Error calling fetchAccountData`, error));
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchAccountData, isRefreshing]);

  return {
    isRefreshing,
    refresh,
  };
}
