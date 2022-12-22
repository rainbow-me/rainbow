import AppEth from '@ledgerhq/hw-app-eth';
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble';
import { forEach } from 'lodash';
import { useEffect, useState } from 'react';
import { getHdPath, LEDGER_LIVE } from '@/model/wallet';

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

/**
 * Parses ledger errors based on common issues
 */
const ledgerErrorStateHandler = (error: Error) => {
  if (error.message.includes('0x6511')) {
    return 2;
  }
  if (
    error.name.includes('BleError') ||
    error.message.includes('0x6b0c') ||
    error.message.includes('busy')
  ) {
    return 1;
  }
  console.log('Unknown error: ', error);
  forEach(Object.keys(error), key =>
    // @ts-ignore
    console.log('key: ', key, ' value: ', error[key])
  );
  return 0;
};

/**
 * React hook used for checking ledger connections and handling connnection error states
 */
export function useLedgerStatusCheck({
  deviceId,
  errorCallback,
  successCallback,
}: {
  deviceId: string;
  successCallback: Function;
  errorCallback?: Function;
}) {
  const [
    connectionStatus,
    setConnectionStatus,
  ] = useState<LEDGER_CONNECTION_STATUS>(LEDGER_CONNECTION_STATUS.LOADING);
  const [errorState, setErrorState] = useState(0);
  const [poller, setPoller] = useState<NodeJS.Timer | null>(null);

  /**
   * Handles local error handling for useLedgerStatusCheck
   */
  const handleLedgerError = (error: Error) => {
    setConnectionStatus(LEDGER_CONNECTION_STATUS.ERROR);
    setErrorState(ledgerErrorStateHandler(error));
    errorCallback?.();
  };

  /**
   * Handles successful ledger connection
   */
  const handleLedgerSuccess = () => {
    setConnectionStatus(LEDGER_CONNECTION_STATUS.READY);
    setErrorState(0);
    successCallback?.();
  };

  /**
   * Checks ledger connection status and sets errorState
   */
  const ledgerStatusCheck = async () => {
    try {
      const transport = TransportBLE.open(deviceId);
      transport.then(transport => {
        const eth = new AppEth(transport);
        const path = getHdPath(LEDGER_LIVE, 1);
        const addressResult = eth.getAddress(path);
        addressResult.then(res => {
          console.log('successful connection');
          handleLedgerSuccess();
        });
        addressResult.catch(e => {
          console.log('error handling');
          handleLedgerError(e);
        });
      });

      transport.catch(e => {
        console.log('transport error: ', e);
        handleLedgerError(e);
      });
      console.log('disconnecting');
      TransportBLE.disconnect(deviceId);
    } catch (e: any) {
      handleLedgerError(e);
    }
  };

  /**
   * Initializes polling for ledger connection status
   */
  const pollerInit = async () => {
    console.log('running checks');
    await ledgerStatusCheck();
    const timer = setInterval(async () => {
      console.log('polling');
      await ledgerStatusCheck();
    }, 3000);
    setPoller(timer);
  };

  useEffect(() => {
    pollerInit();
    return () => {
      console.log('Polling stopped');
      if (poller) {
        clearInterval(poller);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId]);

  return { errorState, ledgerStatusCheck };
}
