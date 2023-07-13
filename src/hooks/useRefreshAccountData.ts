import { captureException } from '@sentry/react-native';
import delay from 'delay';
import { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import NetworkTypes from '../helpers/networkTypes';
import { fetchAssetsFromRefraction } from '../redux/explorer';
import { updatePositions } from '../redux/usersPositions';
import { walletConnectLoadState } from '../redux/walletconnect';
import { fetchWalletENSAvatars, fetchWalletNames } from '../redux/wallets';
import useAccountSettings from './useAccountSettings';
import useSavingsAccount from './useSavingsAccount';
import { PROFILES, useExperimentalFlag } from '@/config';
import logger from '@/utils/logger';
import { queryClient } from '@/react-query';
import { nftsQueryKey } from '@/resources/nfts';
import { positionsQueryKey } from '@/resources/defi/PositionsQuery';

export default function useRefreshAccountData() {
  const dispatch = useDispatch();
  const { accountAddress, network, nativeCurrency } = useAccountSettings();
  // @ts-expect-error ts-migrate(2554) FIXME: Expected 1 arguments, but got 0.
  const { refetchSavings } = useSavingsAccount();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const profilesEnabled = useExperimentalFlag(PROFILES);

  const fetchAccountData = useCallback(async () => {
    // Nothing to refresh for other testnets
    if (network !== NetworkTypes.mainnet) {
      return Promise.all([delay(1250)]);
    }

    queryClient.invalidateQueries({
      queryKey: nftsQueryKey({ address: accountAddress }),
    });
    queryClient.invalidateQueries({
      queryKey: positionsQueryKey({
        address: accountAddress,
        currency: nativeCurrency,
      }),
    });

    try {
      const getWalletNames = dispatch(fetchWalletNames());
      const getWalletENSAvatars = profilesEnabled
        ? dispatch(fetchWalletENSAvatars())
        : null;
      const balances = dispatch(fetchAssetsFromRefraction());
      const wc = dispatch(walletConnectLoadState());
      const uniswapPositions = dispatch(updatePositions());
      return Promise.all([
        delay(1250), // minimum duration we want the "Pull to Refresh" animation to last
        getWalletNames,
        getWalletENSAvatars,
        // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'true' is not assignable to param... Remove this comment to see the full error message
        refetchSavings(true),
        balances,
        wc,
        uniswapPositions,
      ]);
    } catch (error) {
      logger.log('Error refreshing data', error);
      captureException(error);
      throw error;
    }
  }, [
    accountAddress,
    dispatch,
    nativeCurrency,
    network,
    profilesEnabled,
    refetchSavings,
  ]);

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
