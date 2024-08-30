import { captureException } from '@sentry/react-native';
import { useCallback } from 'react';
import { InteractionManager } from 'react-native';
import { useDispatch } from 'react-redux';
import { explorerInit } from '../redux/explorer';
import { logger, RainbowError } from '@/logger';

export default function useInitializeAccountData() {
  const dispatch = useDispatch();

  const initializeAccountData = useCallback(async () => {
    try {
      InteractionManager.runAfterInteractions(() => {
        logger.debug('[useInitializeAccountData]: Initialize account data');
        dispatch(explorerInit());
      });
    } catch (error) {
      logger.error(new RainbowError(`[useInitializeAccountData]: Error initializing account data: ${error}`));
      captureException(error);
    }
  }, [dispatch]);

  return initializeAccountData;
}
