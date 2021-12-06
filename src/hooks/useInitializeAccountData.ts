import { captureException } from '@sentry/react-native';
import { useCallback } from 'react';
import { InteractionManager } from 'react-native';
import { useDispatch } from 'react-redux';
import { explorerInit } from '../redux/explorer';
import { uniqueTokensRefreshState } from '../redux/uniqueTokens';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'logger' or its corresponding t... Remove this comment to see the full error message
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
    } catch (error) {
      logger.sentry('Error initializing account data');
      captureException(error);
    }
  }, [dispatch]);

  return initializeAccountData;
}
