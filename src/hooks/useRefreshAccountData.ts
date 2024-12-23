import delay from 'delay';
import { useCallback, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { fetchWalletENSAvatars, fetchWalletNames } from '../redux/wallets';
import useAccountSettings from './useAccountSettings';
import { PROFILES, useExperimentalFlag } from '@/config';
import { logger, RainbowError } from '@/logger';
import { queryClient } from '@/react-query';
import { userAssetsQueryKey } from '@/__swaps__/screens/Swap/resources/assets/userAssets';
import { invalidateAddressNftsQueries } from '@/resources/nfts';
import { positionsQueryKey } from '@/resources/defi/PositionsQuery';
import { Address } from 'viem';
import { addysSummaryQueryKey } from '@/resources/summary/summary';
import useWallets from './useWallets';
import { claimablesQueryKey } from '@/resources/addys/claimables/query';
import { useConnectedToAnvilStore } from '@/state/connectedToAnvil';

export default function useRefreshAccountData() {
  const dispatch = useDispatch();
  const { accountAddress, nativeCurrency } = useAccountSettings();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const profilesEnabled = useExperimentalFlag(PROFILES);
  const { connectedToAnvil } = useConnectedToAnvilStore();

  const { wallets } = useWallets();

  const allAddresses = useMemo(
    () => Object.values(wallets || {}).flatMap(wallet => (wallet.addresses || []).map(account => account.address as Address)),
    [wallets]
  );

  const fetchAccountData = useCallback(async () => {
    invalidateAddressNftsQueries(accountAddress);
    queryClient.invalidateQueries(positionsQueryKey({ address: accountAddress as Address, currency: nativeCurrency }));
    queryClient.invalidateQueries(claimablesQueryKey({ address: accountAddress, currency: nativeCurrency }));
    queryClient.invalidateQueries(addysSummaryQueryKey({ addresses: allAddresses, currency: nativeCurrency }));
    queryClient.invalidateQueries(userAssetsQueryKey({ address: accountAddress, currency: nativeCurrency, testnetMode: connectedToAnvil }));

    try {
      const getWalletNames = dispatch(fetchWalletNames());
      const getWalletENSAvatars = profilesEnabled ? dispatch(fetchWalletENSAvatars()) : null;
      return Promise.all([
        delay(1250), // minimum duration we want the "Pull to Refresh" animation to last
        getWalletNames,
        getWalletENSAvatars,
      ]);
    } catch (error) {
      logger.error(new RainbowError(`[useRefreshAccountData]: Error refreshing data: ${error}`));
      throw error;
    }
  }, [accountAddress, allAddresses, connectedToAnvil, dispatch, nativeCurrency, profilesEnabled]);

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
