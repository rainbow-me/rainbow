import { analytics } from '@/analytics';
import { event } from '@/analytics/event';
import { getOrCreateDeviceId, getWalletContext } from '@/analytics/utils';
import { runKeychainIntegrityChecks } from '@/handlers/walletReadyEvents';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { RainbowError, logger } from '@/logger';
import { PerformanceTracking } from '@/performance/tracking';
import * as Sentry from '@sentry/react-native';
import { captureException } from '@sentry/react-native';
import lang from 'i18n-js';
import { isNil } from 'lodash';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { Address } from 'viem';
import runMigrations from '../model/migrations';
import { walletInit } from '../model/wallet';
import { appStateUpdate } from '../redux/appState';
import { settingsLoadNetwork } from '../redux/settings';
import { loadWallets, updateAccountAddress } from '../redux/wallets';
import useAccountSettings from './useAccountSettings';
import useHideSplashScreen from './useHideSplashScreen';
import useLoadAccountData from './useLoadAccountData';
import useLoadGlobalEarlyData from './useLoadGlobalEarlyData';
import useOpenSmallBalances from './useOpenSmallBalances';

export default function useInitializeWallet() {
  const dispatch = useDispatch();

  const loadAccountData = useLoadAccountData();
  const loadGlobalEarlyData = useLoadGlobalEarlyData();
  const { network } = useAccountSettings();
  const hideSplashScreen = useHideSplashScreen();
  const { setIsSmallBalancesOpen } = useOpenSmallBalances();

  const getWalletStatusForPerformanceMetrics = (isNew: boolean, isImporting: boolean): string => {
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
      // @ts-expect-error This callback will be refactored to use a single object param with full TS typings
      seedPhrase,
      color = null,
      name = null,
      shouldRunMigrations = false,
      overwrite = false,
      checkedWallet = null,
      // @ts-expect-error This callback will be refactored to use a single object param with full TS typings
      switching,
      // @ts-expect-error This callback will be refactored to use a single object param with full TS typings
      image,
      silent = false
    ) => {
      try {
        PerformanceTracking.startMeasuring(event.performanceInitializeWallet);
        logger.debug('[useInitializeWallet]: Start wallet setup');

        const isImporting = !!seedPhrase;
        logger.debug(`[useInitializeWallet]: isImporting? ${isImporting}`);

        if (shouldRunMigrations && !seedPhrase) {
          logger.debug('[useInitializeWallet]: shouldRunMigrations && !seedPhrase? => true');
          loadWallets();
          logger.debug('[useInitializeWallet]: walletsLoadState call #1');
          await runMigrations();
          logger.debug('[useInitializeWallet]: done with migrations');
        }

        setIsSmallBalancesOpen(false);

        // Load the network first
        await dispatch(settingsLoadNetwork());

        const { isNew, walletAddress } = await walletInit(seedPhrase, color, name, overwrite, checkedWallet, network, image, silent);

        logger.debug('[useInitializeWallet]: walletInit returned', {
          isNew,
          walletAddress,
        });

        // Capture wallet context in telemetry
        // walletType maybe undefied after initial wallet creation
        const { walletType, walletAddressHash } = await getWalletContext(walletAddress as Address);
        const [deviceId] = await getOrCreateDeviceId();

        Sentry.setUser({
          id: deviceId,
          walletAddressHash,
          walletType,
        });

        // Allows calling telemetry before currentAddress is available (i.e. onboarding)
        if (walletType || walletAddressHash) analytics.setWalletContext({ walletAddressHash, walletType });
        analytics.setDeviceId(deviceId);
        analytics.identify();

        if (!switching) {
          // Run keychain integrity checks right after walletInit
          // Except when switching wallets!
          await runKeychainIntegrityChecks();
        }

        if (seedPhrase || isNew) {
          logger.debug('[useInitializeWallet]: walletsLoadState call #2');
          await loadWallets();
        }

        if (isNil(walletAddress)) {
          logger.debug('[useInitializeWallet]: walletAddress is nil');
          Alert.alert(lang.t('wallet.import_failed_invalid_private_key'));
          if (!isImporting) {
            dispatch(appStateUpdate({ walletReady: true }));
          }
          return null;
        }

        if (!(isNew || isImporting)) {
          await loadGlobalEarlyData();
          logger.debug('[useInitializeWallet]: loaded global data...');
        }

        updateAccountAddress(walletAddress);
        logger.debug('[useInitializeWallet]: updated wallet address', {
          walletAddress,
        });

        // Newly created / imported accounts have no data in localstorage
        if (!(isNew || isImporting)) {
          await loadAccountData();
          logger.debug('[useInitializeWallet]: loaded account data', {
            network,
          });
        }

        dispatch(appStateUpdate({ walletReady: true }));
        logger.debug('[useInitializeWallet]: 💰 Wallet initialized');

        PerformanceTracking.finishMeasuring(event.performanceInitializeWallet, {
          walletStatus: getWalletStatusForPerformanceMetrics(isNew, isImporting),
        });

        return walletAddress;
      } catch (error) {
        PerformanceTracking.clearMeasure(event.performanceInitializeWallet);
        logger.error(new RainbowError('[useInitializeWallet]: Error while initializing wallet'), {
          error,
        });
        // TODO specify error states more granular
        if (!switching) {
          await runKeychainIntegrityChecks();
        }

        try {
          hideSplashScreen();
        } catch (err) {
          logger.error(new RainbowError('[useInitializeWallet]: Error while hiding splash screen'), {
            error: err,
          });
        }

        captureException(error);
        Alert.alert(lang.t('wallet.something_went_wrong_importing'));
        dispatch(appStateUpdate({ walletReady: true }));
        return null;
      }
    },
    [dispatch, hideSplashScreen, loadAccountData, loadGlobalEarlyData, network, setIsSmallBalancesOpen]
  );

  return initializeWallet;
}
