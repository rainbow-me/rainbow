import { analytics } from '@/analytics';
import { logger, RainbowError } from '@/logger';
import { createQueryKey, queryClient } from '@/react-query';
<<<<<<< HEAD
=======
import { addysSummaryQueryKey } from '@/resources/summary/summary';
>>>>>>> origin/develop
import { userAssetsStore } from '@/state/assets/userAssets';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { useClaimablesStore } from '@/state/claimables/claimables';
import { usePositionsStore } from '@/state/positions/positions';
<<<<<<< HEAD
import { refetchWalletSummary } from '@/state/wallets/useWalletSummaryStore';
import { getAccountAddress, refreshWalletInfo } from '@/state/wallets/walletsStore';
import { time } from '@/utils';
import delay from 'delay';
import { useCallback, useState } from 'react';
=======
import { getAccountAddress, getWallets, refreshWalletInfo } from '@/state/wallets/walletsStore';
import { time } from '@/utils';
import delay from 'delay';
import { useCallback, useState } from 'react';
import { Address } from 'viem';
>>>>>>> origin/develop

// minimum duration we want the "Pull to Refresh" animation to last
const MIN_REFRESH_DURATION = 1_250;

export const refreshAccountData = async () => {
<<<<<<< HEAD
  const accountAddress = getAccountAddress();

  // These queries can take too long to fetch, so we do not wait for them
  refetchWalletSummary();
  queryClient.invalidateQueries([createQueryKey('nfts', { address: accountAddress })]);
=======
  const nativeCurrency = userAssetsStoreManager.getState().currency;
  const accountAddress = getAccountAddress();
  const wallets = getWallets();
  const allAddresses = Object.values(wallets || {}).flatMap(wallet => (wallet.addresses || []).map(account => account.address as Address));

  // These queries can take too long to fetch, so we do not wait for them
  queryClient.invalidateQueries([
    addysSummaryQueryKey({ addresses: allAddresses, currency: nativeCurrency }),
    createQueryKey('nfts', { address: accountAddress }),
  ]);
>>>>>>> origin/develop

  await Promise.all([
    delay(MIN_REFRESH_DURATION),
    refreshWalletInfo(),
    userAssetsStore.getState().fetch(undefined, { staleTime: 0 }),
    useBackendNetworksStore.getState().fetch(undefined, { staleTime: time.seconds(30) }),
    usePositionsStore.getState().fetch(undefined, { staleTime: time.seconds(5) }),
    useClaimablesStore.getState().fetch(undefined, { staleTime: time.seconds(5) }),
  ]);
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
