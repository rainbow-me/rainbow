import { analytics } from '@/analytics';
import { PROFILES, useExperimentalFlag } from '@/config';
import { logger, RainbowError } from '@/logger';
import { createQueryKey, queryClient } from '@/react-query';
import { addysSummaryQueryKey } from '@/resources/summary/summary';
import { userAssetsStore } from '@/state/assets/userAssets';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { useClaimablesStore } from '@/state/claimables/claimables';
import { usePositionsStore } from '@/state/positions/positions';
import { refreshWalletENSAvatars, refreshWalletNames, useWalletsStore, useAccountAddress } from '@/state/wallets/walletsStore';
import { time } from '@/utils';
import delay from 'delay';
import { useCallback, useMemo, useState } from 'react';
import { Address } from 'viem';
import useAccountSettings from './useAccountSettings';

// minimum duration we want the "Pull to Refresh" animation to last
const MIN_REFRESH_DURATION = 1_250;

export default function useRefreshAccountData() {
  const accountAddress = useAccountAddress();
  const { nativeCurrency } = useAccountSettings();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const profilesEnabled = useExperimentalFlag(PROFILES);
  const wallets = useWalletsStore(state => state.wallets);

  const allAddresses = useMemo(
    () => Object.values(wallets || {}).flatMap(wallet => (wallet.addresses || []).map(account => account.address as Address)),
    [wallets]
  );

  const fetchAccountData = useCallback(async () => {
    const getWalletENSAvatars = profilesEnabled ? refreshWalletENSAvatars() : null;

    // These queries can take too long to fetch, so we do not wait for them
    queryClient.invalidateQueries([
      addysSummaryQueryKey({ addresses: allAddresses, currency: nativeCurrency }),
      createQueryKey('nfts', { address: accountAddress }),
    ]);

    await Promise.all([
      delay(MIN_REFRESH_DURATION),
      refreshWalletNames(),
      getWalletENSAvatars,
      userAssetsStore.getState().fetch(undefined, { staleTime: 0 }),
      useBackendNetworksStore.getState().fetch(undefined, { staleTime: time.seconds(30) }),
      usePositionsStore.getState().fetch(undefined, { staleTime: time.seconds(5) }),
      useClaimablesStore.getState().fetch(undefined, { staleTime: time.seconds(5) }),
    ]);
  }, [accountAddress, allAddresses, nativeCurrency, profilesEnabled]);

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
