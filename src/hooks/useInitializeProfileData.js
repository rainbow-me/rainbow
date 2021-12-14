import { captureException } from '@sentry/react-native';
import { useCallback } from 'react';
import { InteractionManager } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { transactionSignaturesLoadState } from '@rainbow-me/redux/transactionSignatures';
import logger from 'logger';

export default function useInitializeProfileData() {
  const dispatch = useDispatch();
  const walletReady = useSelector(
    ({ appState: { walletReady } }) => walletReady
  );

  const initializeProfileData = useCallback(async () => {
    if (!walletReady) {
      return;
    }
    try {
      InteractionManager.runAfterInteractions(() => {
        // Other profile related actions should be triggered here
        dispatch(transactionSignaturesLoadState());
      });
    } catch (error) {
      logger.sentry('Error initializing account data');
      captureException(error);
    }
  }, [dispatch, walletReady]);

  return initializeProfileData;
}
