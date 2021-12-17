import { captureException } from '@sentry/react-native';
import { useCallback } from 'react';
import { InteractionManager } from 'react-native';
import { useDispatch } from 'react-redux';
import { explorerInit } from '../redux/explorer';
import { uniqueTokensRefreshState } from '../redux/uniqueTokens';
import { updatePositions } from '@rainbow-me/redux/usersPositions';
import logger from 'logger';

export default function useInitializeAccountData() {
  const dispatch = useDispatch();

  const initializeAccountData = useCallback(async () => {
    try {
      InteractionManager.runAfterInteractions(() => {
        logger.sentry('Initialize account data');
        dispatch(explorerInit());
      });

      InteractionManager.runAfterInteractions(async () => {
        logger.sentry('Initialize uniqueTokens');
        await dispatch(uniqueTokensRefreshState());
      });

      InteractionManager.runAfterInteractions(async () => {
        logger.sentry('Initialize pool positions');
        dispatch(updatePositions());
      });
    } catch (error) {
      logger.sentry('Error initializing account data');
      captureException(error);
    }
  }, [dispatch]);

  return initializeAccountData;
}
