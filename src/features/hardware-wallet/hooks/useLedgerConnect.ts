import { useCallback, useEffect, useRef } from 'react';

import TransportBLE from '@ledgerhq/react-native-hw-transport-ble';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';

import { ensureError, logger, RainbowError } from '@/logger';

import { ledgerIsReadyAtom, readyForPollingAtom, triggerPollerCleanupAtom } from '../state/hardwareWalletTxState';
import { checkLedgerConnection, LEDGER_ERROR_CODES } from '../utils/ledger';

/**
 * Polls a Ledger connection and reconnects after a disconnect until the device is ready.
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
}): void {
  const transport = useRef<TransportBLE | undefined>(undefined);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isReady = useRecoilValue(ledgerIsReadyAtom);
  const [triggerPollerCleanup, setTriggerPollerCleanup] = useRecoilState(triggerPollerCleanupAtom);
  const setReadyForPolling = useSetRecoilState(readyForPollingAtom);

  const handleLedgerError = useCallback(
    async (errorType: LEDGER_ERROR_CODES) => {
      if (isReady) return;
      if (errorType === LEDGER_ERROR_CODES.DISCONNECTED) {
        setReadyForPolling(false);
        logger.debug('[useLedgerConnect]: Device Disconnected - Attempting Reconnect', {});
        transport.current = undefined;
        try {
          transport.current = await TransportBLE.open(deviceId);
          setReadyForPolling(true);
        } catch (error) {
          logger.error(new RainbowError('[useLedgerConnect]: Reconnect Error'), {
            error: ensureError(error).message,
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

  const handleLedgerSuccess = useCallback(() => {
    if (!readyForPolling) return;
    successCallback?.(deviceId);
    pollerCleanup(timer.current);
  }, [deviceId, readyForPolling, successCallback]);

  const pollerCleanup = (poller: ReturnType<typeof setTimeout> | undefined): void => {
    try {
      if (poller) {
        logger.debug('[useLedgerConnect]: polling tear down', {});
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
      logger.debug('[useLedgerConnect]: init device polling', {});
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
