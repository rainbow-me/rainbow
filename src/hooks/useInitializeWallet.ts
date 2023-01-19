import { captureException } from '@sentry/react-native';
import lang from 'i18n-js';
import { isNil } from 'lodash';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import runMigrations from '../model/migrations';
import { walletInit } from '../model/wallet';
import { PerformanceTracking } from '../performance/tracking';
import { PerformanceMetrics } from '../performance/tracking/types/PerformanceMetrics';
import { appStateUpdate } from '../redux/appState';
import {
  settingsLoadNetwork,
  settingsUpdateAccountAddress,
} from '../redux/settings';
import { uniswapPairsInit } from '../redux/uniswap';
import { walletsLoadState } from '../redux/wallets';
import useAccountSettings from './useAccountSettings';
import useHideSplashScreen from './useHideSplashScreen';
import useInitializeAccountData from './useInitializeAccountData';
import useLoadAccountData from './useLoadAccountData';
import useLoadGlobalEarlyData from './useLoadGlobalEarlyData';
import useOpenSmallBalances from './useOpenSmallBalances';
import useResetAccountState from './useResetAccountState';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { PROFILES, useExperimentalFlag } from '@/config';
import { runKeychainIntegrityChecks } from '@/handlers/walletReadyEvents';
import { checkPendingTransactionsOnInitialize } from '@/redux/data';
import logger from '@/utils/logger';

export default function useInitializeWallet() {
  const dispatch = useDispatch();
  const resetAccountState = useResetAccountState();
  const loadAccountData = useLoadAccountData();
  const loadGlobalEarlyData = useLoadGlobalEarlyData();
  const initializeAccountData = useInitializeAccountData();
  const { network } = useAccountSettings();
  const hideSplashScreen = useHideSplashScreen();
  const { setIsSmallBalancesOpen } = useOpenSmallBalances();
  const profilesEnabled = useExperimentalFlag(PROFILES);

  const getWalletStatusForPerformanceMetrics = (
    isNew: boolean,
    isImporting: boolean
  ): string => {
    if (isNew) {
      return 'new';
    } else if (isImporting) {
      return 'imported';
    } else {
      return 'old';
    }
  };

  const initializeWallet = useCallback(
    async (
      seedPhrase,
      color = null,
      name = null,
      shouldRunMigrations = false,
      overwrite = false,
      checkedWallet = null,
      switching,
      image,
      silent = false
    ) => {
      try {
        PerformanceTracking.startMeasuring(
          PerformanceMetrics.useInitializeWallet
        );
        logger.sentry('Start wallet setup');
        await resetAccountState();
        logger.sentry('resetAccountState ran ok');

        const isImporting = !!seedPhrase;
        logger.sentry('isImporting?', isImporting);

        if (shouldRunMigrations && !seedPhrase) {
          logger.sentry('shouldRunMigrations && !seedPhrase? => true');
          await dispatch(walletsLoadState(profilesEnabled));
          logger.sentry('walletsLoadState call #1');
          await runMigrations();
          logger.sentry('done with migrations');
        }

        setIsSmallBalancesOpen(false);

        // Load the network first
        await dispatch(settingsLoadNetwork());

        const { isNew, walletAddress } = await walletInit(
          seedPhrase,
          color,
          name,
          overwrite,
          checkedWallet,
          network,
          image,
          silent
        );

        logger.sentry('walletInit returned ', {
          isNew,
          walletAddress,
        });

        if (!switching) {
          // Run keychain integrity checks right after walletInit
          // Except when switching wallets!
          await runKeychainIntegrityChecks();
        }

        if (seedPhrase || isNew) {
          logger.sentry('walletsLoadState call #2');
          await dispatch(walletsLoadState(profilesEnabled));
        }

        if (isNil(walletAddress)) {
          logger.sentry('walletAddress is nil');
          Alert.alert(lang.t('wallet.import_failed_invalid_private_key'));
          if (!isImporting) {
            dispatch(appStateUpdate({ walletReady: true }));
          }
          return null;
        }

        if (!(isNew || isImporting)) {
          await loadGlobalEarlyData();
          logger.sentry('loaded global data...');
        }

        await dispatch(settingsUpdateAccountAddress(walletAddress));
        logger.sentry('updated settings address', walletAddress);

        // Newly created / imported accounts have no data in localstorage
        if (!(isNew || isImporting)) {
          await loadAccountData(network);
          logger.sentry('loaded account data', network);
        }

        hideSplashScreen();
        logger.sentry('Hide splash screen');
        initializeAccountData();

        dispatch(appStateUpdate({ walletReady: true }));

        if (!switching) {
          dispatch(uniswapPairsInit());
        }

        logger.sentry('💰 Wallet initialized');
        PerformanceTracking.finishMeasuring(
          PerformanceMetrics.useInitializeWallet,
          {
            walletStatus: getWalletStatusForPerformanceMetrics(
              isNew,
              isImporting
            ),
          }
        );

        dispatch(checkPendingTransactionsOnInitialize(walletAddress));
        return walletAddress;
      } catch (error) {
        PerformanceTracking.clearMeasure(
          PerformanceMetrics.useInitializeWallet
        );
        logger.sentry('Error while initializing wallet');
        // TODO specify error states more granular
        if (!switching) {
          await runKeychainIntegrityChecks();
        }
        hideSplashScreen();
        captureException(error);
        Alert.alert(lang.t('wallet.something_went_wrong_importing'));
        dispatch(appStateUpdate({ walletReady: true }));
        return null;
      }
    },
    [
      dispatch,
      hideSplashScreen,
      initializeAccountData,
      loadAccountData,
      loadGlobalEarlyData,
      network,
      profilesEnabled,
      resetAccountState,
      setIsSmallBalancesOpen,
    ]
  );

  return initializeWallet;
}
