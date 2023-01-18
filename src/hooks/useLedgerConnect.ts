import AppEth from '@ledgerhq/hw-app-eth';
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble';
import { forEach } from 'lodash';
import { useCallback, useEffect, useState } from 'react';
import useWallets from './useWallets';
import { getHardwareKey, getHdPath, WalletLibraryType } from '@/model/wallet';
import { DebugContext } from '@/logger/debugContext';
import { logger, RainbowError } from '@/logger';
import * as i18n from '@/languages';

enum LEDGER_ERROR_CODES {
  OFF_OR_LOCKED = 'off_or_locked',
  NO_ETH_APP = 'no_eth_app',
  UNKNOWN = 'unknown',
  DISCONNECTED = 'disconnected',
}

export const getLedgerErrorText = (errorCode: LEDGER_ERROR_CODES) => {
  switch (errorCode) {
    case LEDGER_ERROR_CODES.OFF_OR_LOCKED:
      return i18n.t(i18n.l.hardware_wallets.errors.off_or_locked);
    case LEDGER_ERROR_CODES.NO_ETH_APP:
      return i18n.t(i18n.l.hardware_wallets.errors.no_eth_app);
    default:
      return i18n.t(i18n.l.hardware_wallets.errors.unknown);
  }
};

export enum LEDGER_CONNECTION_STATUS {
  LOADING = 'loading',
  READY = 'ready',
  ERROR = 'error',
}

/**
 * Parses ledger errors based on common issues
 */
const ledgerErrorStateHandler = (error: Error) => {
  if (error.message.includes('0x6511')) {
    return LEDGER_ERROR_CODES.NO_ETH_APP;
  }
  if (
    error.name.includes('BleError') ||
    error.message.includes('0x6b0c') ||
    error.message.includes('busy')
  ) {
    return LEDGER_ERROR_CODES.OFF_OR_LOCKED;
  }

  // used to logging any new errors so we can handle them properly, will likely remove pre-release
  logger.warn('[LedgerConnect] - Unknown Error', { error });
  forEach(Object.keys(error), key =>
    // @ts-ignore
    logger.debug('key: ', key, ' value: ', error[key])
  );

  return LEDGER_ERROR_CODES.UNKNOWN;
};

/**
 * React hook used for checking ledger connections and handling connnection error states
 */
export function useLedgerStatusCheck({
  address,
  errorCallback,
  successCallback,
}: {
  address: string;
  successCallback: () => void;
  errorCallback?: () => void;
}) {
  const { selectedWallet } = useWallets();

  const [
    connectionStatus,
    setConnectionStatus,
  ] = useState<LEDGER_CONNECTION_STATUS>(LEDGER_CONNECTION_STATUS.LOADING);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transport, setTransport] = useState<TransportBLE | null>(null);
  const [ethApp, setEthApp] = useState<AppEth | null>(null);

  /**
   * Handles local error handling for useLedgerStatusCheck
   */
  const handleLedgerError = useCallback(
    (error: Error) => {
      if (error.message.toLowerCase().includes('disconnected')) {
        setEthApp(null);
        setTransport(null);
        setConnectionStatus(LEDGER_CONNECTION_STATUS.LOADING);
        //setErrorMessage(LEDGER_ERROR_CODES.DISCONNECTED);
        return;
      }
      /*
      if (error.message.includes('Ledger Device is busy (lock')) {
      } */

      setConnectionStatus(LEDGER_CONNECTION_STATUS.ERROR);
      setErrorMessage(getLedgerErrorText(ledgerErrorStateHandler(error)));
      errorCallback?.();
    },
    [errorCallback]
  );

  /**
   * Handles successful ledger connection
   */
  const handleLedgerSuccess = useCallback(() => {
    setConnectionStatus(LEDGER_CONNECTION_STATUS.READY);
    setErrorMessage(null);
    successCallback?.();
  }, [successCallback]);

  /**
   * Cleans up ledger connection polling
   */
  const pollerCleanup = (poller: NodeJS.Timer) => {
    if (poller) {
      logger.debug(
        '[LedgerConnect] - polling tear down',
        {},
        DebugContext.ledger
      );
      clearInterval(poller);
      poller?.unref();
    }
  };
  /**
   * Gets device id from keychain as a fallback if deviceId is not available
   */
  const getDeviceId = useCallback(async (): Promise<string | undefined> => {
    logger.debug(
      '[LedgerConnect] - no device id, getting device id',
      {},
      DebugContext.ledger
    );
    const privateKey = await getHardwareKey(address);
    const deviceId = privateKey?.privateKey?.split('/')[0];
    return deviceId;
  }, [address]);

  /**
   * Checks ledger connection status and sets errorState
   */
  const ledgerStatusCheck = useCallback(async () => {
    try {
      if (!transport) {
        logger.debug(
          '[LedgerConnect] - no transport, opening transport',
          {},
          DebugContext.ledger
        );
        let deviceIdToUse = selectedWallet?.deviceId;
        if (!deviceIdToUse) {
          deviceIdToUse = await getDeviceId();
        }
        console.log('deviceId: ', deviceIdToUse);
        const newTransport = TransportBLE.open(deviceIdToUse);
        newTransport.then(newTransport => {
          setTransport(newTransport);

          logger.debug(
            '[LedgerConnect] - init ledger app',
            {},
            DebugContext.ledger
          );
          const newEthApp = new AppEth(newTransport);
          setEthApp(newEthApp);
        });

        newTransport.catch(e => {
          logger.error(new RainbowError('[LedgerConnect] - transport error'), {
            error: e,
          });
          handleLedgerError(e);
        });
      }
      if (ethApp) {
        handleLedgerSuccess();
        console.log('we have eth app');
        const path = getHdPath({ type: WalletLibraryType.ledger, index: 1 });
        const addressResult = ethApp.getAddress(path);
        addressResult.then(res => {
          logger.debug(
            '[LedgerConnect] - connection success',
            {},
            DebugContext.ledger
          );
          handleLedgerSuccess();
        });
        addressResult.catch(e => {
          logger.warn('[LedgerConnect] - address check error');
          handleLedgerError(e);
        });
      }
    } catch (e: any) {
      logger.error(
        new RainbowError('[LedgerConnect] - ledger status check error'),
        { error: e }
      );
      handleLedgerError(e);
    }
  }, [
    transport,
    ethApp,
    selectedWallet?.deviceId,
    getDeviceId,
    handleLedgerError,
    handleLedgerSuccess,
  ]);

  useEffect(() => {
    logger.debug(
      '[LedgerConnect] - init device polling',
      {},
      DebugContext.ledger
    );
    ledgerStatusCheck();
    const timer = setInterval(async () => {
      await ledgerStatusCheck();
    }, 3000);

    return () => {
      pollerCleanup(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transport, ethApp]);

  return { connectionStatus, errorMessage };
}
