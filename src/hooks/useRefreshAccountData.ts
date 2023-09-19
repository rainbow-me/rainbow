import { captureException } from '@sentry/react-native';
import delay from 'delay';
import { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { getCachedProviderForNetwork, isHardHat } from '@/handlers/web3';
import NetworkTypes from '../helpers/networkTypes';
import { walletConnectLoadState } from '../redux/walletconnect';
import { fetchWalletENSAvatars, fetchWalletNames } from '../redux/wallets';
import useAccountSettings from './useAccountSettings';
import { PROFILES, useExperimentalFlag } from '@/config';
import logger from '@/utils/logger';
import { queryClient } from '@/react-query';
import { userAssetsQueryKey } from '@/resources/assets/UserAssetsQuery';
import { nftsQueryKey } from '@/resources/nfts';
import { positionsQueryKey } from '@/resources/defi/PositionsQuery';

export default function useRefreshAccountData() {
  const dispatch = useDispatch();
  const { accountAddress, network, nativeCurrency } = useAccountSettings();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const profilesEnabled = useExperimentalFlag(PROFILES);

  const fetchAccountData = useCallback(async () => {
    // Nothing to refresh for other testnets
    if (network !== NetworkTypes.mainnet) {
      return Promise.all([delay(1250)]);
    }

    const provider = getCachedProviderForNetwork(network);
    const providerUrl = provider?.connection?.url;
    const connectedToHardhat = isHardHat(providerUrl);

    queryClient.invalidateQueries({
      queryKey: nftsQueryKey({ address: accountAddress }),
    });
    queryClient.invalidateQueries({
      queryKey: positionsQueryKey({
        address: accountAddress,
        currency: nativeCurrency,
      }),
    });
    queryClient.invalidateQueries({
      queryKey: userAssetsQueryKey({
        address: accountAddress,
        currency: nativeCurrency,
        connectedToHardhat,
      }),
    });

    try {
      const getWalletNames = dispatch(fetchWalletNames());
      const getWalletENSAvatars = profilesEnabled
        ? dispatch(fetchWalletENSAvatars())
        : null;
      const wc = dispatch(walletConnectLoadState());
      return Promise.all([
        delay(1250), // minimum duration we want the "Pull to Refresh" animation to last
        getWalletNames,
        getWalletENSAvatars,
        wc,
      ]);
    } catch (error) {
      logger.log('Error refreshing data', error);
      captureException(error);
      throw error;
    }
  }, [accountAddress, dispatch, nativeCurrency, network, profilesEnabled]);

  const refresh = useCallback(async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);

    try {
      await fetchAccountData();
    } catch (e) {
      logger.error(e);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchAccountData, isRefreshing]);

  return {
    isRefreshing,
    refresh,
  };
}
