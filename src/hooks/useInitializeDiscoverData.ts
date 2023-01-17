import { captureException } from '@sentry/react-native';
import { useCallback } from 'react';
import { InteractionManager } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { userListsLoadState } from '../redux/userLists';
import { AppState } from '@/redux/store';
import logger from '@/utils/logger';

export default function useInitializeDiscoverData() {
  const dispatch = useDispatch();
  const walletReady = useSelector(
    ({ appState: { walletReady } }: AppState) => walletReady
  );

  const initializeDiscoverData = useCallback(async () => {
    if (!walletReady) {
      return;
    }
    try {
      InteractionManager.runAfterInteractions(() => {
        // Other discover related actions should be triggered here
        dispatch(userListsLoadState());
      });
    } catch (error) {
      logger.sentry('Error initializing account data');
      captureException(error);
    }
  }, [dispatch, walletReady]);

  return initializeDiscoverData;
}
