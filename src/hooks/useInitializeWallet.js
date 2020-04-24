import { captureException } from '@sentry/react-native';
import { isNil } from 'lodash';
import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useDispatch } from 'react-redux';
import { getAccountInfo } from '../handlers/localstorage/accountLocal';
import runMigrations from '../model/migrations';
import { walletInit } from '../model/wallet';
import {
  settingsLoadNetwork,
  settingsUpdateAccountAddress,
  settingsUpdateAccountColor,
  settingsUpdateAccountName,
} from '../redux/settings';
import { logger } from '../utils';
import useAccountSettings from './useAccountSettings';
import useClearAccountData from './useClearAccountData';
import useHideSplashScreen from './useHideSplashScreen';
import useInitializeAccountData from './useInitializeAccountData';
import useLoadAccountData from './useLoadAccountData';

export default function useInitializeWallet() {
  const dispatch = useDispatch();
  const onHideSplashScreen = useHideSplashScreen();
  const clearAccountData = useClearAccountData();
  const loadAccountData = useLoadAccountData();
  const initializeAccountData = useInitializeAccountData();

  const { network } = useAccountSettings();

  const initializeWallet = useCallback(
    async seedPhrase => {
      try {
        logger.sentry('Start wallet setup');
        // Load the network first
        await dispatch(settingsLoadNetwork());

        const { isImported, isNew, walletAddress } = await walletInit(
          seedPhrase
        );
        const info = await getAccountInfo(walletAddress, network);
        if (info.name && info.color) {
          dispatch(settingsUpdateAccountName(info.name));
          dispatch(settingsUpdateAccountColor(info.color));
        }
        if (isNil(walletAddress)) {
          Alert.alert(
            'Import failed due to an invalid private key. Please try again.'
          );
          return null;
        }
        if (isImported) {
          await clearAccountData();
        }
        dispatch(settingsUpdateAccountAddress(walletAddress));
        if (!(isNew || isImported)) {
          await loadAccountData(network);
        }
        await runMigrations();
        onHideSplashScreen();
        logger.sentry('Hide splash screen');
        initializeAccountData();
        return walletAddress;
      } catch (error) {
        // TODO specify error states more granular
        onHideSplashScreen();
        captureException(error);
        Alert.alert('Something went wrong while importing. Please try again!');
        return null;
      }
    },
    [
      clearAccountData,
      dispatch,
      initializeAccountData,
      loadAccountData,
      network,
      onHideSplashScreen,
    ]
  );

  return initializeWallet;
}
