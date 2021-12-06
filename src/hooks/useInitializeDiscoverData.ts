import { captureException } from '@sentry/react-native';
import { useCallback } from 'react';
import { InteractionManager } from 'react-native';
import { useDispatch } from 'react-redux';
import { userListsLoadState } from '../redux/userLists';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'logger' or its corresponding t... Remove this comment to see the full error message
import logger from 'logger';

export default function useInitializeDiscoverData() {
  const dispatch = useDispatch();

  const initializeDiscoverData = useCallback(async () => {
    try {
      InteractionManager.runAfterInteractions(() => {
        // Other discover related actions should be triggered here
        dispatch(userListsLoadState());
      });
    } catch (error) {
      logger.sentry('Error initializing account data');
      captureException(error);
    }
  }, [dispatch]);

  return initializeDiscoverData;
}
