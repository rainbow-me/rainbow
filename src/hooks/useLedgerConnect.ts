import { useCallback, useEffect } from 'react';
import { DebugContext } from '@/logger/debugContext';
import { logger } from '@/logger';
import { checkLedgerConnection, LEDGER_ERROR_CODES } from '@/utils/ledger';

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
  /**
   * Handles local error handling for useLedgerStatusCheck
   */
  const handleLedgerError = useCallback(
    (errorType: LEDGER_ERROR_CODES) => {
      errorCallback?.(errorType);
    },
    [errorCallback]
  );

  /**
   * Handles successful ledger connection
   */
  const handleLedgerSuccess = useCallback(() => {
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
}
