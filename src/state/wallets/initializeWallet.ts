import { analytics } from '@/analytics';
import { event } from '@/analytics/event';
import { getOrCreateDeviceId } from '@/analytics/utils';
import { getWalletContext } from '@/analytics/getWalletContext';
import { runKeychainIntegrityChecks } from '@/handlers/walletReadyEvents';
import { WrappedAlert as Alert } from '@/helpers/alert';
import * as i18n from '@/languages';
import { RainbowError, ensureError, logger } from '@/logger';
import * as Sentry from '@sentry/react-native';
import { isNil } from 'lodash';
import { Address } from 'viem';
import runMigrations from '../../model/migrations';
import { InitializeWalletParams, walletInit } from '../../model/wallet';
import { settingsLoadNetwork } from '../../redux/settings';
import { loadWallets, setAccountAddress, setWalletReady } from '@/state/wallets/walletsStore';
import { hideSplashScreen } from '@/hooks/useHideSplashScreen';
import { loadTokensData } from '@/state/tokens/loadTokensData';
import { loadSettingsData } from '../settings/loadSettingsData';
import { PerformanceTracking } from '../../performance/tracking';
import { ensureValidHex } from '../../handlers/web3';
import store from '@/redux/store';
import { setIsSmallBalancesOpen } from '@/state/wallets/smallBalancesStore';

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

export const initializeWallet = async (props: InitializeWalletParams = {}) => {
  const {
    seedPhrase,
    color = null,
    name = null,
    shouldRunMigrations = false,
    overwrite = false,
    checkedWallet = null,
    switching = false,
    image,
    silent = false,
    userPin,
  } = props;

  const network = store.getState().settings.network;
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
    await store.dispatch(settingsLoadNetwork());

    console.log('init', props);
    const { isNew, walletAddress } = await walletInit({
      seedPhrase,
      color,
      name,
      overwrite,
      checkedWallet,
      network,
      image,
      silent,
      userPin,
    });

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
      await loadSettingsData();
      logger.debug('[useInitializeWallet]: loaded global data...');
    }

    setAccountAddress(ensureValidHex(walletAddress));
    logger.debug('[useInitializeWallet]: updated wallet address', {
      walletAddress,
    });

    // Newly created / imported accounts have no data in localstorage
    if (!(isNew || isImporting)) {
      await loadTokensData();
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
    console.log('what was the error', error?.message, error?.stack);
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
};
