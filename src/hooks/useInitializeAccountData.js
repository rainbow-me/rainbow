import { captureException } from '@sentry/react-native';
import { useCallback } from 'react';
import { InteractionManager } from 'react-native';
import { useDispatch } from 'react-redux';
import { explorerInit } from '../redux/explorer';
import { savingsLoadState } from '../redux/savings';
import { uniqueTokensRefreshState } from '../redux/uniqueTokens';
import { uniswapGetAllExchanges, uniswapPairsInit } from '../redux/uniswap';
import { logger } from '../utils';

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
        await dispatch(savingsLoadState());
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
