import { useCallback, useEffect, useState } from 'react';
import { DebugContext } from '@/logger/debugContext';
import { logger } from '@/logger';
import { checkLedgerConnection, LEDGER_ERROR_CODES } from '@/utils/ledger';

export enum LEDGER_CONNECTION_STATUS {
  LOADING = 'loading',
  READY = 'ready',
  ERROR = 'error',
}

/**
 * React hook used for checking ledger connections and handling connnection error states
 */
export function useLedgerConnect({
  readyForPolling = true,
  deviceId,
  errorCallback,
  successCallback,
}: {
  readyForPolling?: boolean;
  deviceId: string;
  successCallback: (deviceId: string) => void;
  errorCallback?: (errorType: LEDGER_ERROR_CODES) => void;
}) {
  const [
    connectionStatus,
    setConnectionStatus,
  ] = useState<LEDGER_CONNECTION_STATUS>(LEDGER_CONNECTION_STATUS.LOADING);

  /**
   * Handles local error handling for useLedgerStatusCheck
   */
  const handleLedgerError = useCallback(
    (errorType: LEDGER_ERROR_CODES) => {
      // just saving these in case we need them
      /*
      if (error.message.toLowerCase().includes('disconnected')) {
        setConnectionStatus(LEDGER_CONNECTION_STATUS.LOADING);
        //setErrorCode(LEDGER_ERROR_CODES.DISCONNECTED);
        return;
      }*/

      /*
      if (error.message.includes('Ledger Device is busy (lock')) {
      } */
      setConnectionStatus(LEDGER_CONNECTION_STATUS.ERROR);
      errorCallback?.(errorType);
    },
    [errorCallback]
  );

  /**
   * Handles successful ledger connection
   */
  const handleLedgerSuccess = useCallback(() => {
    setConnectionStatus(LEDGER_CONNECTION_STATUS.READY);
    successCallback?.(deviceId);
  }, [deviceId, successCallback]);

  /**
   * Cleans up ledger connection polling
   */
  const pollerCleanup = (poller: NodeJS.Timer | null) => {
    try {
      if (poller) {
        logger.debug(
          '[LedgerConnect] - polling tear down',
          {},
          DebugContext.ledger
        );
        clearInterval(poller);
        poller?.unref();
      }
    } catch {
      // swallow
    }
  };
  useEffect(() => {
    let timer: NodeJS.Timer | null = null;
    if (readyForPolling) {
      logger.debug(
        '[LedgerConnect] - init device polling',
        {},
        DebugContext.ledger
      );
      timer = setInterval(async () => {
        if (readyForPolling) {
          await checkLedgerConnection({
            deviceId,
            successCallback: handleLedgerSuccess,
            errorCallback: handleLedgerError,
          });
        }
      }, 2000);
    }

    return () => {
      pollerCleanup(timer);
    };
  }, [deviceId, handleLedgerError, handleLedgerSuccess, readyForPolling]);

  return { connectionStatus };
}
