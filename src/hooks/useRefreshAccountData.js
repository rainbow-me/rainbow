import { captureException } from '@sentry/react-native';
import delay from 'delay';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import networkTypes from '../helpers/networkTypes';
import { uniswapUpdateState } from '../redux/uniswap';
import { uniqueTokensRefreshState } from '../redux/uniqueTokens';
import { logger } from '../utils';
import useAccountSettings from './useAccountSettings';

export default function useRefreshAccountData() {
  const dispatch = useDispatch();
  const { network } = useAccountSettings();

  const refreshAccountData = useCallback(async () => {
    // Nothing to refresh for testnets
    if (network !== networkTypes.mainnet) {
      return Promise.all([delay(1250)]);
    }

    try {
      const getUniswap = dispatch(uniswapUpdateState());
      const getUniqueTokens = dispatch(uniqueTokensRefreshState());

      return Promise.all([
        delay(1250), // minimum duration we want the "Pull to Refresh" animation to last
        getUniswap,
        getUniqueTokens,
      ]);
    } catch (error) {
      logger.log('Error refreshing data', error);
      captureException(error);
      throw error;
    }
  }, [dispatch, network]);

  return refreshAccountData;
}
