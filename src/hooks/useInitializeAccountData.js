import { captureException } from '@sentry/react-native';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useAccountSettings } from '../hooks';
import { explorerInit } from '../redux/explorer';
import { uniswapPairsInit } from '../redux/uniswap';
import { uniqueTokensRefreshState } from '../redux/uniqueTokens';
import { sentryUtils } from '../utils';

export default function useInitializeAccountData() {
  const dispatch = useDispatch();
  const { network } = useAccountSettings();

  const initializeAccountData = useCallback(async () => {
    try {
      sentryUtils.addInfoBreadcrumb('Initialize account data');
      console.log('Initialize account data for ', network);
      dispatch(explorerInit());
      dispatch(uniswapPairsInit());
      await dispatch(uniqueTokensRefreshState());
    } catch (error) {
      // TODO error state
      console.log('Error initializing account data: ', error);
      captureException(error);
    }
  }, [dispatch, network]);

  return initializeAccountData;
}
