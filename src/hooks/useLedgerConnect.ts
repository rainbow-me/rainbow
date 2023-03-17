import { useCallback, useEffect, useRef } from 'react';
import { DebugContext } from '@/logger/debugContext';
import { logger } from '@/logger';
import { checkLedgerConnection, LEDGER_ERROR_CODES } from '@/utils/ledger';
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble';

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
  const transport = useRef<TransportBLE | null>();

  /**
   * Handles local error handling for useLedgerStatusCheck
   */
  const handleLedgerError = useCallback(
    async (errorType: LEDGER_ERROR_CODES) => {
      if (errorType === LEDGER_ERROR_CODES.DISCONNECTED) {
        logger.debug(
          '[LedgerConnect] - Device Disconnected - Attempting Reconnect',
          {},
          DebugContext.ledger
        );
        transport.current = null;
        try {
          transport.current = await TransportBLE.open(deviceId);
        } catch (e) {
          logger.warn('[LedgerConnect] - Reconnect Error', {
            error: (e as Error).message,
          });
          errorCallback?.(errorType);
        }
      } else {
        errorCallback?.(errorType);
      }
    },
    [deviceId, errorCallback]
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
        if (transport.current) {
          if (readyForPolling) {
            await checkLedgerConnection({
              transport: transport.current,
              deviceId,
              successCallback: handleLedgerSuccess,
              errorCallback: handleLedgerError,
            });
          }
        } else {
          // eslint-disable-next-line require-atomic-updates
          transport.current = await TransportBLE.open(deviceId);
        }
      }, 2000);
    }

    return () => {
      pollerCleanup(timer);
    };
  }, [deviceId, handleLedgerError, handleLedgerSuccess, readyForPolling]);
}
