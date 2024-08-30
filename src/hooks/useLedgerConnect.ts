import { useCallback, useEffect, useRef } from 'react';
import { logger, RainbowError } from '@/logger';
import { checkLedgerConnection, LEDGER_ERROR_CODES } from '@/utils/ledger';
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { LedgerIsReadyAtom, readyForPollingAtom, triggerPollerCleanupAtom } from '@/navigation/HardwareWalletTxNavigator';

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
  const transport = useRef<TransportBLE | undefined>();
  const timer = useRef<NodeJS.Timeout | undefined>(undefined);
  const isReady = useRecoilValue(LedgerIsReadyAtom);
  const [triggerPollerCleanup, setTriggerPollerCleanup] = useRecoilState(triggerPollerCleanupAtom);
  const setReadyForPolling = useSetRecoilState(readyForPollingAtom);

  /**
   * Handles local error handling for useLedgerStatusCheck
   */
  const handleLedgerError = useCallback(
    async (errorType: LEDGER_ERROR_CODES) => {
      if (isReady) return;
      if (errorType === LEDGER_ERROR_CODES.DISCONNECTED) {
        setReadyForPolling(false);
        logger.info('[LedgerConnect] - Device Disconnected - Attempting Reconnect', {});
        transport.current = undefined;
        try {
          transport.current = await TransportBLE.open(deviceId);
          setReadyForPolling(true);
        } catch (e) {
          logger.error(new RainbowError('[LedgerConnect] - Reconnect Error'), {
            error: (e as Error).message,
          });
          // temp removing this to see if it fixes an issue
          // errorCallback?.(errorType);
        }
      } else {
        errorCallback?.(errorType);
      }
    },
    [deviceId, errorCallback, isReady, setReadyForPolling]
  );

  /**
   * Handles successful ledger connection
   */
  const handleLedgerSuccess = useCallback(() => {
    if (!readyForPolling) return;
    successCallback?.(deviceId);
    pollerCleanup(timer.current);
  }, [deviceId, readyForPolling, successCallback]);

  /**
   * Cleans up ledger connection polling
   */
  const pollerCleanup = (poller: NodeJS.Timer | undefined) => {
    try {
      if (poller) {
        logger.debug('[LedgerConnect] - polling tear down', {});
        clearInterval(poller);
        poller?.unref();
        timer.current = undefined;
      }
    } catch {
      // swallow
    }
  };
  useEffect(() => {
    if (readyForPolling && (!timer.current || triggerPollerCleanup)) {
      logger.debug('[LedgerConnect] - init device polling', {});
      setTriggerPollerCleanup(false);
      timer.current = setInterval(async () => {
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
      }, 3000);
    }
  }, [deviceId, handleLedgerError, handleLedgerSuccess, readyForPolling, setTriggerPollerCleanup, triggerPollerCleanup]);

  useEffect(() => {
    return () => {
      pollerCleanup(timer.current);
    };
  }, []);
}
