import { useCallback, useEffect, useRef, useState } from 'react';
import { DebugContext } from '@/logger/debugContext';
import { listen } from '@ledgerhq/logs';
import { logger } from '@/logger';
import { checkLedgerConnection, LEDGER_ERROR_CODES } from '@/utils/ledger';
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import {
  LedgerIsReadyAtom,
  readyForPollingAtom,
  triggerPollerCleanupAtom,
} from '@/navigation/HardwareWalletTxNavigator';
import { delay } from '@/helpers/utilities';
import { random } from 'lodash';

let isPolling = false;
let isMounted = false;
let transport: TransportBLE | undefined = undefined;

listen(log => console.log(log));
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
  const timer = useRef<NodeJS.Timeout | undefined>(undefined);
  const isReady = useRecoilValue(LedgerIsReadyAtom);
  const [triggerPollerCleanup, setTriggerPollerCleanup] = useRecoilState(
    triggerPollerCleanupAtom
  );
  const setReadyForPolling = useSetRecoilState(readyForPollingAtom);

  /**
   * Handles local error handling for useLedgerStatusCheck
   */
  const handleLedgerError = useCallback(
    async (errorType: LEDGER_ERROR_CODES) => {
      if (isReady) return;
      if (errorType === LEDGER_ERROR_CODES.DISCONNECTED) {
        setReadyForPolling(false);
        logger.debug(
          '[LedgerConnect] - Device Disconnected - Attempting Reconnect',
          {},
          DebugContext.ledger
        );
        transport = undefined;
        try {
          const newTransport = await TransportBLE.open(deviceId);
          transport = newTransport;
          setReadyForPolling(true);
        } catch (e) {
          logger.warn('[LedgerConnect] - Reconnect Error', {
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
        logger.debug(
          '[LedgerConnect] - polling tear down',
          {},
          DebugContext.ledger
        );
        clearInterval(poller);
        poller?.unref();
        timer.current = undefined;
      }
    } catch {
      // swallow
    }
  };

  useEffect(() => {
    isMounted = true;
    logger.debug(
      '[LedgerConnect] -  effect',
      { readyForPolling, isReady, isMounted },
      DebugContext.ledger
    );
    const runPromise = async (
      currentTransport: TransportBLE | undefined,
      random: number
    ) => {
      isPolling = true;
      if (!readyForPolling || !isMounted) {
        logger.debug(
          '[LedgerConnect] - stopping device polling ',
          { readyForPolling, isReady, isMounted, random },
          DebugContext.ledger
        );
        return;
      }

      await delay(1000);

      setTriggerPollerCleanup(false);
      logger.debug(
        `[LedgerConnect] - device polling ${random}`,
        { readyForPolling, isReady, isMounted },
        DebugContext.ledger
      );

      // if we have transport, we can check the connection

      try {
        if (currentTransport) {
          console.log(`transport exists ${random}`);
          await checkLedgerConnection({
            transport: currentTransport,
            deviceId,
            successCallback: handleLedgerSuccess,
            errorCallback: handleLedgerError,
          });
        } else {
          console.log('transport does not exist');
          // eslint-disable-next-line no-param-reassign
          currentTransport = await TransportBLE.open(deviceId);
          console.log('after transport open');
          if (currentTransport) {
            await checkLedgerConnection({
              transport: currentTransport,
              deviceId,
              successCallback: handleLedgerSuccess,
              errorCallback: handleLedgerError,
            });
          }
        }

        console.log('after all async logic');

        // if we are not ready, we need to continue polling
        if (!isReady && readyForPolling && isMounted) {
          logger.debug(
            `[LedgerConnect] - device polling recurve ${random}`,
            { readyForPolling, isReady, isMounted },
            DebugContext.ledger
          );
          runPromise(currentTransport, random);
        } else {
          logger.debug(
            '[LedgerConnect] - after all logic wtf?',
            { readyForPolling, isReady, isMounted },
            DebugContext.ledger
          );
        }
      } catch (error) {
        console.log('CAUGHT ERROR: ', error);
        runPromise(currentTransport, random);
      }
    };

    if (!isReady && !isPolling && readyForPolling) {
      const rand = Math.floor(Math.random() * 100);
      logger.debug(
        `[LedgerConnect] - init device polling ${rand}`,
        { readyForPolling, isReady, isMounted },
        DebugContext.ledger
      );

      runPromise(transport, rand);
    }
  }, [
    isReady,
    deviceId,
    handleLedgerError,
    handleLedgerSuccess,
    readyForPolling,
    setTriggerPollerCleanup,
    triggerPollerCleanup,
  ]);

  useEffect(() => {
    return () => {
      console.log('CLEANING UP CLEANING UP CLEANING UP CLEANING UP ');
      isMounted = false;
      isPolling = false;
    };
  }, []);
}
