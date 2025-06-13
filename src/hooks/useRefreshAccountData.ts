import { analytics } from '@/analytics';
import { logger, RainbowError } from '@/logger';
import { createQueryKey, queryClient } from '@/react-query';
import { addysSummaryQueryKey } from '@/resources/summary/summary';
import { userAssetsStore } from '@/state/assets/userAssets';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { useClaimablesStore } from '@/state/claimables/claimables';
import { usePositionsStore } from '@/state/positions/positions';
import { getAccountAddress, getWallets, refreshWalletInfo } from '@/state/wallets/walletsStore';
import { time } from '@/utils';
import delay from 'delay';
import { useCallback, useState } from 'react';
import { Address } from 'viem';
import { useNftsStore } from '@/state/nfts/nfts';
import { PAGE_SIZE } from '@/state/nfts/createNftsStore';

// minimum duration we want the "Pull to Refresh" animation to last
const MIN_REFRESH_DURATION = 1_250;

export const refreshAccountData = async () => {
  const nativeCurrency = userAssetsStoreManager.getState().currency;
  const accountAddress = getAccountAddress();
  const wallets = getWallets();
  const allAddresses = Object.values(wallets || {}).flatMap(wallet => (wallet.addresses || []).map(account => account.address as Address));

  // These queries can take too long to fetch, so we do not wait for them
  queryClient.invalidateQueries([
    addysSummaryQueryKey({ addresses: allAddresses, currency: nativeCurrency }),
    createQueryKey('nfts', { address: accountAddress }),
  ]);

  await Promise.all([
    delay(MIN_REFRESH_DURATION),
    refreshWalletInfo(),
    userAssetsStore.getState().fetch(undefined, { staleTime: 0 }),
    useBackendNetworksStore.getState().fetch(undefined, { staleTime: time.seconds(30) }),
    usePositionsStore.getState().fetch(undefined, { staleTime: time.seconds(5) }),
    useClaimablesStore.getState().fetch(undefined, { staleTime: time.seconds(5) }),
    useNftsStore.getState().fetch({ limit: PAGE_SIZE }, { staleTime: time.seconds(5) }),
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
