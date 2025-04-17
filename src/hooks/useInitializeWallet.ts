import { analytics } from '@/analytics';
import { event } from '@/analytics/event';
import { getOrCreateDeviceId, getWalletContext } from '@/analytics/utils';
import { runKeychainIntegrityChecks } from '@/handlers/walletReadyEvents';
import { WrappedAlert as Alert } from '@/helpers/alert';
import * as i18n from '@/languages';
import { RainbowError, ensureError, logger } from '@/logger';
import * as Sentry from '@sentry/react-native';
import { isNil } from 'lodash';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { Address } from 'viem';
import runMigrations from '../model/migrations';
import { walletInit } from '../model/wallet';
import { settingsLoadNetwork } from '../redux/settings';
import { loadWallets, setAccountAddress, setWalletReady } from '@/state/wallets/walletsStore';
import useAccountSettings from './useAccountSettings';
import useHideSplashScreen from './useHideSplashScreen';
import useLoadAccountData from './useLoadAccountData';
import useLoadGlobalEarlyData from './useLoadGlobalEarlyData';
import useOpenSmallBalances from './useOpenSmallBalances';
import { PerformanceTracking } from '../performance/tracking';
import { ensureValidHex } from '../handlers/web3';

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

export default function useInitializeWallet() {
  const dispatch = useDispatch();

  const loadAccountData = useLoadAccountData();
  const loadGlobalEarlyData = useLoadGlobalEarlyData();
  const { network } = useAccountSettings();
  const hideSplashScreen = useHideSplashScreen();
  const { setIsSmallBalancesOpen } = useOpenSmallBalances();

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
        PerformanceTracking.startMeasuring(event.performanceInitializeWallet);
        logger.debug('[useInitializeWallet]: Start wallet setup');

        const isImporting = !!seedPhrase;
        logger.debug(`[useInitializeWallet]: isImporting? ${isImporting}`);

        if (shouldRunMigrations && !seedPhrase) {
          logger.debug('[useInitializeWallet]: shouldRunMigrations && !seedPhrase? => true');
          await loadWallets();
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
          Alert.alert(i18n.t(i18n.l.wallet.import_failed_invalid_private_key));
          if (!isImporting) {
            setWalletReady();
          }
          return null;
        }

        if (!(isNew || isImporting)) {
          await loadGlobalEarlyData();
          logger.debug('[useInitializeWallet]: loaded global data...');
        }

        setAccountAddress(ensureValidHex(walletAddress));
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

        setWalletReady();
        logger.debug('[useInitializeWallet]: 💰 Wallet initialized');

        PerformanceTracking.finishMeasuring(event.performanceInitializeWallet, {
          walletStatus,
        });

        return walletAddress;
      } catch (e) {
        const error = ensureError(e);
        PerformanceTracking.clearMeasure(event.performanceInitializeWallet);
        logger.error(new RainbowError('[useInitializeWallet]: Error while initializing wallet', error), {
          walletStatus,
        });
        analytics.track(event.walletInitializationFailed, {
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
        setWalletReady();
        return null;
      }
    },
    [dispatch, hideSplashScreen, loadAccountData, loadGlobalEarlyData, network, setIsSmallBalancesOpen]
  );

  return initializeWallet;
}
