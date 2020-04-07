import { captureException } from '@sentry/react-native';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { explorerInit } from '../redux/explorer';
import { uniswapGetAllExchanges, uniswapPairsInit } from '../redux/uniswap';
import { uniqueTokensRefreshState } from '../redux/uniqueTokens';
import { logger } from '../utils';
import { InteractionManager } from 'react-native';

export default function useInitializeAccountData() {
  const dispatch = useDispatch();

  const initializeAccountData = useCallback(async () => {
    try {
      InteractionManager.runAfterInteractions(() => {
        logger.sentry('Initialize account data');
        dispatch(explorerInit());
      });

      InteractionManager.runAfterInteractions(async () => {
        await dispatch(uniswapPairsInit());
        await dispatch(uniswapGetAllExchanges());
      });

      InteractionManager.runAfterInteractions(async () => {
        await dispatch(uniqueTokensRefreshState());
      });
    } catch (error) {
      // TODO error state
      logger.log('Error initializing account data: ', error);
      captureException(error);
    }
  }, [dispatch]);

  return initializeAccountData;
}
