import * as i18n from '@/languages';
import { isNil } from 'lodash';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import runMigrations from '../model/migrations';
import { walletInit } from '../model/wallet';
import { PerformanceTracking } from '../performance/tracking';
import { PerformanceMetrics } from '../performance/tracking/types/PerformanceMetrics';
import { appStateUpdate } from '../redux/appState';
import { settingsLoadNetwork, settingsUpdateAccountAddress } from '../redux/settings';
import { walletsLoadState } from '../redux/wallets';
import useAccountSettings from './useAccountSettings';
import useHideSplashScreen from './useHideSplashScreen';
import useLoadAccountData from './useLoadAccountData';
import useLoadGlobalEarlyData from './useLoadGlobalEarlyData';
import useOpenSmallBalances from './useOpenSmallBalances';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { runKeychainIntegrityChecks } from '@/handlers/walletReadyEvents';
import { RainbowError, ensureError, logger } from '@/logger';
import { getOrCreateDeviceId, getWalletContext } from '@/analytics/utils';
import * as Sentry from '@sentry/react-native';
import { analyticsV2 } from '@/analytics';
import { Address } from 'viem';
import { event } from '@/analytics/event';

export default function useInitializeWallet() {
  const dispatch = useDispatch();

  const loadAccountData = useLoadAccountData();
  const loadGlobalEarlyData = useLoadGlobalEarlyData();
  const { network } = useAccountSettings();
  const hideSplashScreen = useHideSplashScreen();
  const { setIsSmallBalancesOpen } = useOpenSmallBalances();

  type WalletStatus = 'unknown' | 'new' | 'imported' | 'old';

  function getWalletStatus(isNew: boolean, isImporting: boolean): WalletStatus {
    if (isNew) {
      return 'new';
    } else if (isImporting) {
      return 'imported';
    } else {
      return 'old';
    }
  }

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
      let walletStatus: WalletStatus = 'unknown';
      try {
        PerformanceTracking.startMeasuring(PerformanceMetrics.useInitializeWallet);
        logger.debug('[useInitializeWallet]: Start wallet setup');

        const isImporting = !!seedPhrase;
        logger.debug(`[useInitializeWallet]: isImporting? ${isImporting}`);

        if (shouldRunMigrations && !seedPhrase) {
          logger.debug('[useInitializeWallet]: shouldRunMigrations && !seedPhrase? => true');
          await dispatch(walletsLoadState());
          logger.debug('[useInitializeWallet]: walletsLoadState call #1');
          await runMigrations();
          logger.debug('[useInitializeWallet]: done with migrations');
        }

        setIsSmallBalancesOpen(false);

        // Load the network first
        await dispatch(settingsLoadNetwork());

        const { isNew, walletAddress } = await walletInit(seedPhrase, color, name, overwrite, checkedWallet, network, image, silent);
        walletStatus = getWalletStatus(isNew, isImporting);

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
        if (walletType || walletAddressHash) analyticsV2.setWalletContext({ walletAddressHash, walletType });
        analyticsV2.setDeviceId(deviceId);
        analyticsV2.identify();

        if (!switching) {
          // Run keychain integrity checks right after walletInit
          // Except when switching wallets!
          await runKeychainIntegrityChecks();
        }

        if (seedPhrase || isNew) {
          logger.debug('[useInitializeWallet]: walletsLoadState call #2');
          await dispatch(walletsLoadState());
        }

        if (isNil(walletAddress)) {
          logger.debug('[useInitializeWallet]: walletAddress is nil');
          Alert.alert(i18n.t(i18n.l.wallet.import_failed_invalid_private_key));
          if (!isImporting) {
            dispatch(appStateUpdate({ walletReady: true }));
          }
          return null;
        }

        if (!(isNew || isImporting)) {
          await loadGlobalEarlyData();
          logger.debug('[useInitializeWallet]: loaded global data...');
        }

        await dispatch(settingsUpdateAccountAddress(walletAddress));
        logger.debug('[useInitializeWallet]: updated settings address', {
          walletAddress,
        });

        // Newly created / imported accounts have no data in localstorage
        if (!(isNew || isImporting)) {
          await loadAccountData();
          logger.debug('[useInitializeWallet]: loaded account data', {
            network,
          });
        }

        try {
          hideSplashScreen();
        } catch (err) {
          logger.error(new RainbowError('[useInitializeWallet]: Error while hiding splash screen'), {
            error: err,
          });
        }

        dispatch(appStateUpdate({ walletReady: true }));
        logger.debug('[useInitializeWallet]: 💰 Wallet initialized');

        PerformanceTracking.finishMeasuring(PerformanceMetrics.useInitializeWallet, {
          walletStatus,
        });

        return walletAddress;
      } catch (e) {
        const error = ensureError(e);
        PerformanceTracking.clearMeasure(PerformanceMetrics.useInitializeWallet);
        logger.error(new RainbowError('[useInitializeWallet]: Error while initializing wallet', error), {
          walletStatus,
        });
        analyticsV2.track(event.walletInitializationFailed, {
          error: error.message,
          walletStatus,
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

        Alert.alert(i18n.t(i18n.l.wallet.something_went_wrong_importing));
        dispatch(appStateUpdate({ walletReady: true }));
        return null;
      }
    },
    [dispatch, hideSplashScreen, loadAccountData, loadGlobalEarlyData, network, setIsSmallBalancesOpen]
  );

  return initializeWallet;
}
