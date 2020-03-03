import { captureException } from '@sentry/react-native';
import { isNil } from 'lodash';
import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useDispatch } from 'react-redux';
import {
  getIsWalletEmpty,
  getAccountInfo,
} from '../handlers/localstorage/accountLocal';
import { hasEthBalance } from '../handlers/web3';
import { useAccountSettings } from '../hooks';
import { walletInit } from '../model/wallet';
import { setIsWalletEthZero } from '../redux/isWalletEthZero';
import {
  settingsLoadNetwork,
  settingsUpdateAccountAddress,
  settingsUpdateAccountName,
  settingsUpdateAccountColor,
} from '../redux/settings';
import useClearAccountData from './useClearAccountData';
import useLoadAccountData from './useLoadAccountData';
import useHideSplashScreen from './useHideSplashScreen';
import useInitializeAccountData from './useInitializeAccountData';

import { sentryUtils } from '../utils';

export default function useInitializeWallet() {
  const dispatch = useDispatch();
  const onHideSplashScreen = useHideSplashScreen();
  const clearAccountData = useClearAccountData();
  const loadAccountData = useLoadAccountData();
  const initializeAccountData = useInitializeAccountData();

  const checkEthBalance = useCallback(
    async walletAddress => {
      try {
        const ethBalance = await hasEthBalance(walletAddress);
        dispatch(setIsWalletEthZero(!ethBalance));
      } catch (error) {
        console.log('Error: Checking eth balance', error);
      }
    },
    [dispatch]
  );

  const { network } = useAccountSettings();

  const initializeWallet = useCallback(
    async seedPhrase => {
      try {
        sentryUtils.addInfoBreadcrumb('Start wallet setup');
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
        if (isNew) {
          dispatch(setIsWalletEthZero(true));
        } else if (isImported) {
          try {
            await checkEthBalance(walletAddress);
            // eslint-disable-next-line no-empty
          } catch (error) {}
        } else {
          const isWalletEmpty = await getIsWalletEmpty(walletAddress, network);
          if (isNil(isWalletEmpty)) {
            checkEthBalance(walletAddress);
          } else {
            dispatch(setIsWalletEthZero(isWalletEmpty));
          }
          await loadAccountData();
        }
        onHideSplashScreen();
        sentryUtils.addInfoBreadcrumb('Hide splash screen');
        initializeAccountData();
        return walletAddress;
      } catch (error) {
        // TODO specify error states more granular
        onHideSplashScreen();
        captureException(error);
        Alert.alert(
          'Import failed due to an invalid private key. Please try again.'
        );
        return null;
      }
    },
    [
      checkEthBalance,
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
