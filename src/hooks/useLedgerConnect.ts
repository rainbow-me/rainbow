import AppEth from '@ledgerhq/hw-app-eth';
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble';
import { forEach } from 'lodash';
import {  useEffect, useState } from 'react';
import { getHdPath, LEDGER_LIVE,  } from '@/model/wallet';
import useWallets from './useWallets';

enum LEDGER_ERROR_CODES {
  OFF_OR_LOCKED = 'off_or_locked',
  NO_ETH_APP = 'no_eth_app',
  UNKNOWN = 'unknown',
}

export const getLedgerErrorText = (errorCode: LEDGER_ERROR_CODES) => {
  switch (errorCode) {
    case LEDGER_ERROR_CODES.OFF_OR_LOCKED:
      return 'Make sure your device is unlocked';
    case LEDGER_ERROR_CODES.NO_ETH_APP:
      return 'Open the Eth App on your device';
    default:
      return 'Unknown Error, close and reopen this sheet';
  }
};

export enum LEDGER_CONNECTION_STATUS {
  LOADING = 'loading',
  READY = 'ready',
  ERROR = 'error',
}

type LedgerConnectError = {
  code: LEDGER_ERROR_CODES;
  message: string;
};

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
  console.log('Unknown error: ', error);
  forEach(Object.keys(error), key =>
     // need to add bettter logging/reporting
    // @ts-ignore
    console.log('key: ', key, ' value: ', error[key])
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
  successCallback?: () => void;
  errorCallback?: () => void;
}) {
  const { selectedWallet } = useWallets();

  const [
    connectionStatus,
    setConnectionStatus,
  ] = useState<LEDGER_CONNECTION_STATUS>(LEDGER_CONNECTION_STATUS.LOADING);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [poller, setPoller] = useState<NodeJS.Timer | null>(null);

  /**
   * Handles local error handling for useLedgerStatusCheck
   */
  const handleLedgerError = (error: Error) => {
    if (error.message.includes('Ledger Device is busy (lock')) {
      return;
    }
    console.log('ERROR: ', error);
    setConnectionStatus(LEDGER_CONNECTION_STATUS.ERROR);
    setErrorMessage(getLedgerErrorText(ledgerErrorStateHandler(error)));
    errorCallback?.();
  };

  /**
   * Handles successful ledger connection
   */
  const handleLedgerSuccess = () => {
    setConnectionStatus(LEDGER_CONNECTION_STATUS.READY);
    setErrorMessage(null);
    successCallback?.();
    //pollerSlowdown();
    //TransportBLE.disconnect(deviceId);
  };

  /**
   * Checks ledger connection status and sets errorState
   */
  const ledgerStatusCheck = async () => {
    try {
      console.log('checking connection');
      let deviceId = selectedWallet?.deviceId;
      console.log('deviceId: ', deviceId);
      const transport = TransportBLE.open(deviceId);
      transport.then(transport => {
        const eth = new AppEth(transport);
        const path = getHdPath({type: LEDGER_LIVE, index: 1});
        const addressResult = eth.getAddress(path);
        addressResult.then(res => {
          handleLedgerSuccess();
          TransportBLE.disconnect(deviceId);
        });
        addressResult.catch(e => {
          console.log('error handling');
          handleLedgerError(e);
          TransportBLE.disconnect(deviceId);
        });
      });

      transport.catch(e => {
        console.log('transport error: ', e);
        handleLedgerError(e);
      });
    } catch (e: any) {
      console.log('error: ', e);
      handleLedgerError(e);
    }
  };

  /**
   * Initializes polling for ledger connection status
   */
  const pollerInit = async () => {
    await ledgerStatusCheck();
    const timer = setInterval(async () => {
      console.log('polling');
      await ledgerStatusCheck();
    }, 5000);
    setPoller(timer);
  };

  const pollerSlowdown = async () => {
    const timer = setInterval(async () => {
      console.log('slowing down polling');
      await ledgerStatusCheck();
    }, 10000);
    pollerCleanup();
    setPoller(timer);
  };

  const pollerCleanup = () => {
    if (poller) {
      clearInterval(poller);
      poller.unref();
      setPoller(null);
    }
  };

  useEffect(() => {
    pollerInit();
    return () => {
      console.log('!!!!!!!!!!!!!!!!!!!!!!!! Polling stopped');
      pollerCleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { connectionStatus, errorMessage, ledgerStatusCheck };
}