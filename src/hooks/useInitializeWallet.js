import { captureException } from '@sentry/react-native';
import { isNil } from 'lodash';
import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useDispatch } from 'react-redux';
import useHideSplashScreen from '../helpers/hideSplashScreen';
import runMigrations from '../model/migrations';
import { walletInit } from '../model/wallet';
import {
  settingsLoadNetwork,
  settingsUpdateAccountAddress,
} from '../redux/settings';
import { walletsLoadState } from '../redux/wallets';
import { logger } from '../utils';
import useAccountSettings from './useAccountSettings';
import useInitializeAccountData from './useInitializeAccountData';
import useLoadAccountData from './useLoadAccountData';
import useLoadGlobalData from './useLoadGlobalData';
import useResetAccountState from './useResetAccountState';

export default function useInitializeWallet() {
  const dispatch = useDispatch();
  const resetAccountState = useResetAccountState();
  const loadAccountData = useLoadAccountData();
  const loadGlobalData = useLoadGlobalData();
  const initializeAccountData = useInitializeAccountData();

  const { network } = useAccountSettings();
  const hideSplashScreen = useHideSplashScreen();

  const initializeWallet = useCallback(
    async (
      seedPhrase,
      color = null,
      name = null,
      shouldRunMigrations = false
    ) => {
      try {
        logger.sentry('Start wallet setup');

        await resetAccountState();

        const isImported = !!seedPhrase;

        if (shouldRunMigrations && !seedPhrase) {
          await dispatch(walletsLoadState());
          await runMigrations();
        }

        // Load the network first
        await dispatch(settingsLoadNetwork());

        const { isNew, walletAddress } = await walletInit(
          seedPhrase,
          color,
          name
        );

        if (seedPhrase || isNew) {
          await dispatch(walletsLoadState());
        }

        if (isNil(walletAddress)) {
          Alert.alert(
            'Import failed due to an invalid private key. Please try again.'
          );
          return null;
        }

        if (!(isNew || isImported)) {
          await loadGlobalData();
        }

        await dispatch(settingsUpdateAccountAddress(walletAddress));

        if (!(isNew || isImported)) {
          await loadAccountData(network);
        }

        hideSplashScreen();
        logger.sentry('Hide splash screen');
        initializeAccountData();
        return walletAddress;
      } catch (error) {
        logger.sentry('Error while initializing wallet');
        // TODO specify error states more granular
        hideSplashScreen();
        captureException(error);
        Alert.alert('Something went wrong while importing. Please try again!');
        return null;
      }
    },
    [
      resetAccountState,
      dispatch,
      hideSplashScreen,
      initializeAccountData,
      loadGlobalData,
      loadAccountData,
      network,
    ]
  );

  return initializeWallet;
}
