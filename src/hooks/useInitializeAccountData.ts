import { captureException } from '@sentry/react-native';
import { useCallback } from 'react';
import { InteractionManager } from 'react-native';
import { useDispatch } from 'react-redux';
import { explorerInit } from '../redux/explorer';
import { updatePositions } from '@/redux/usersPositions';
import logger from '@/utils/logger';
import { fetchLegacyNFTs } from '@/resources/nfts';
import { useAccountSettings } from '.';

export default function useInitializeAccountData() {
  const dispatch = useDispatch();
  const { accountAddress } = useAccountSettings();

  const initializeAccountData = useCallback(async () => {
    try {
      InteractionManager.runAfterInteractions(() => {
        logger.sentry('Initialize account data');
        dispatch(explorerInit());
      });

      InteractionManager.runAfterInteractions(async () => {
        logger.sentry('Initialize uniqueTokens');
        fetchLegacyNFTs(accountAddress);
      });

      InteractionManager.runAfterInteractions(async () => {
        logger.sentry('Initialize pool positions');
        dispatch(updatePositions());
      });
    } catch (error) {
      logger.sentry('Error initializing account data');
      captureException(error);
    }
  }, [accountAddress, dispatch]);

  return initializeAccountData;
}
