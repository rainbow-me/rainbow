import { analytics } from '@/analytics';
import { event } from '@/analytics/event';
import { getOrCreateDeviceId } from '@/analytics/utils';
import { getWalletContext } from '@/analytics/getWalletContext';
import { runKeychainIntegrityChecks } from '@/handlers/walletReadyEvents';
import { WrappedAlert as Alert } from '@/helpers/alert';
import i18n from '@/languages';
import { RainbowError, ensureError, logger } from '@/logger';
import * as Sentry from '@sentry/react-native';
import { isNil } from 'lodash';
import { Address } from 'viem';
import runMigrations from '../../model/migrations';
import { createWallet, InitializeWalletParams, walletInit } from '../../model/wallet';
import { loadWallets, setAccountAddress, setWalletReady } from '@/state/wallets/walletsStore';
import { hideSplashScreen } from '@/hooks/useHideSplashScreen';
import { PerformanceTracking } from '../../performance/tracking';
import { ensureValidHex } from '../../handlers/web3';
import { settingsStore } from '@/state/settings/settingsStore';
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

let runId = 0;

export const initializeWallet = async (props: InitializeWalletParams = {}) => {
  runId += 1;
  const curRunId = runId;
  const shouldCancel = () => curRunId !== runId;

  const {
    seedPhrase,
    color = null,
    name = null,
    shouldCreateFirstWallet = false,
    shouldRunMigrations = false,
    overwrite = false,
    checkedWallet = null,
    switching = false,
    image,
    silent = false,
    userPin,
  } = props;

  let walletStatus: WalletStatus = 'unknown';
  try {
    PerformanceTracking.startMeasuring(event.performanceInitializeWallet);
    logger.debug('[initializeWallet]: Start wallet setup');

    if (shouldCreateFirstWallet) await createWallet();

    const isImporting = !!seedPhrase;
    logger.debug(`[initializeWallet]: isImporting? ${isImporting}`);

    let didLoadWallets = false;

    if (shouldRunMigrations && !seedPhrase) {
      logger.debug('[initializeWallet]: shouldRunMigrations && !seedPhrase? => true');
      await loadWallets();
      didLoadWallets = true;
      logger.debug('[initializeWallet]: walletsLoadState call #1');
      await runMigrations();
      logger.debug('[initializeWallet]: done with migrations');
    }

    setIsSmallBalancesOpen(false);

    // Load the network first
    let network = settingsStore.getState().network;
    if (!network) {
      await settingsStore.getState().loadNetwork();
      network = settingsStore.getState().network;
    }

    if (shouldCancel()) return null;

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

    if (shouldCancel()) return null;

    walletStatus = getWalletStatus(isNew, isImporting);

    logger.debug('[initializeWallet]: walletInit returned', {
      isNew,
      walletAddress,
    });

    // Capture wallet context in telemetry
    // walletType maybe undefied after initial wallet creation
    const { walletType, walletAddressHash } = await getWalletContext(walletAddress as Address);
    const [deviceId] = await getOrCreateDeviceId();
    if (shouldCancel()) return null;

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
      if (shouldCancel()) return null;

      if (seedPhrase || isNew) {
        logger.debug('[initializeWallet]: walletsLoadState call #2');
        if (!didLoadWallets) await loadWallets();
        if (shouldCancel()) return null;
      }
    }

    if (isNil(walletAddress)) {
      logger.debug('[initializeWallet]: walletAddress is nil');
      Alert.alert(i18n.wallet.import_failed_invalid_private_key());
      if (!isImporting) {
        setWalletReady();
      }
      return null;
    }

    setAccountAddress(ensureValidHex(walletAddress));
    logger.debug('[initializeWallet]: updated wallet address', {
      walletAddress,
    });

    setWalletReady();
    logger.debug('[initializeWallet]: 💰 Wallet initialized');

    PerformanceTracking.finishMeasuring(event.performanceInitializeWallet, {
      walletStatus,
    });

    return walletAddress;
  } catch (e) {
    const error = ensureError(e);
    PerformanceTracking.clearMeasure(event.performanceInitializeWallet);
    logger.error(new RainbowError('[initializeWallet]: Error while initializing wallet', error), {
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
      logger.error(new RainbowError('[initializeWallet]: Error while hiding splash screen'), {
        error: err,
      });
    }

    Alert.alert(i18n.wallet.something_went_wrong_importing());
    setWalletReady();
    return null;
  }
};
