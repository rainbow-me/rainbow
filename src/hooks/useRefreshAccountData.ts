import { PROFILES, useExperimentalFlag } from '@/config';
import { logger, RainbowError } from '@/logger';
import { createQueryKey, queryClient } from '@/react-query';
import { claimablesQueryKey } from '@/resources/addys/claimables/query';
import { positionsQueryKey } from '@/resources/defi/PositionsQuery';
import { addysSummaryQueryKey } from '@/resources/summary/summary';
import { userAssetsStore } from '@/state/assets/userAssets';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { time } from '@/utils';
import delay from 'delay';
import { useCallback, useMemo, useState } from 'react';
import { Address } from 'viem';
import { refreshWalletENSAvatars, refreshWalletNames, useWalletsStore } from '@/state/wallets/walletsStore';
import useAccountSettings from './useAccountSettings';

export default function useRefreshAccountData() {
  const { accountAddress, nativeCurrency } = useAccountSettings();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const profilesEnabled = useExperimentalFlag(PROFILES);
  const wallets = useWalletsStore(state => state.wallets);

  const allAddresses = useMemo(
    () => Object.values(wallets || {}).flatMap(wallet => (wallet.addresses || []).map(account => account.address as Address)),
    [wallets]
  );

  const fetchAccountData = useCallback(async () => {
    userAssetsStore.getState().fetch(undefined, { staleTime: time.seconds(5) });
    useBackendNetworksStore.getState().fetch(undefined, { staleTime: time.seconds(30) });

    queryClient.invalidateQueries([
      addysSummaryQueryKey({ addresses: allAddresses, currency: nativeCurrency }),
      createQueryKey('nfts', { address: accountAddress }),
      positionsQueryKey({ address: accountAddress as Address, currency: nativeCurrency }),
      claimablesQueryKey({ address: accountAddress, currency: nativeCurrency }),
    ]);

    try {
      const getWalletNames = refreshWalletNames();
      const getWalletENSAvatars = profilesEnabled ? refreshWalletENSAvatars() : null;

      return Promise.all([
        delay(1250), // minimum duration we want the "Pull to Refresh" animation to last
        getWalletNames,
        getWalletENSAvatars,
      ]);
    } catch (error) {
      logger.error(new RainbowError(`[useRefreshAccountData]: Error refreshing data: ${error}`));
      throw error;
    }
  }, [accountAddress, allAddresses, nativeCurrency, profilesEnabled]);

  const refresh = useCallback(async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);

    try {
      await fetchAccountData();
    } catch (error) {
      logger.error(new RainbowError(`[useRefreshAccountData]: Error calling fetchAccountData: ${error}`));
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchAccountData, isRefreshing]);

  return {
    isRefreshing,
    refresh,
  };
}
