import { captureException } from '@sentry/react-native';
import { useCallback } from 'react';
import { InteractionManager } from 'react-native';
import { useDispatch } from 'react-redux';
import { explorerInit } from '../redux/explorer';
import { savingsLoadState } from '../redux/savings';
import { uniqueTokensRefreshState } from '../redux/uniqueTokens';
import { uniswapGetAllExchanges, uniswapPairsInit } from '../redux/uniswap';
import { uniswap2GetAllPairsAndTokens } from '../redux/uniswap2';
import { logger } from '../utils';

export default function useInitializeAccountData() {
  const dispatch = useDispatch();

  const initializeAccountData = useCallback(async () => {
    try {
      console.log('FFFF');

      InteractionManager.runAfterInteractions(() => {
        logger.sentry('Initialize account data');
        dispatch(explorerInit());
        console.log('FFFF');
      });

      InteractionManager.runAfterInteractions(async () => {
        dispatch(uniswapPairsInit());
        await dispatch(uniswapGetAllExchanges());
        console.log('FFFF');
        await dispatch(uniswap2GetAllPairsAndTokens());
        console.log('FFFF2');
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
