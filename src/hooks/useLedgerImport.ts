import TransportBLE from '@ledgerhq/react-native-hw-transport-ble';
import { useCallback, useEffect, useRef } from 'react';
import { DebugContext } from '@/logger/debugContext';
import { logger, RainbowError } from '@/logger';
import { Subscription } from '@ledgerhq/hw-transport';
import { checkAndRequestAndroidBluetooth, showBluetoothPermissionsAlert, showBluetoothPoweredOffAlert } from '@/utils/bluetoothPermissions';
import { IS_ANDROID, IS_IOS } from '@/env';
import { ledgerErrorHandler, LEDGER_ERROR_CODES } from '@/utils/ledger';

/**
 * React hook used for checking connecting to a ledger device for the first time
 */
export function useLedgerImport({
  errorCallback,
  successCallback,
}: {
  successCallback?: (deviceId: string) => void;
  errorCallback?: (errorType: LEDGER_ERROR_CODES) => void;
}) {
  const observer = useRef<Subscription | undefined>(undefined);
  const listener = useRef<Subscription | undefined>(undefined);

  const handleCleanUp = () => {
    observer?.current?.unsubscribe();
    listener?.current?.unsubscribe();
  };
  /**
   * Handles local error handling for useLedgerStatusCheck
   */
  const handlePairError = useCallback(
    (error: Error) => {
      logger.error(new RainbowError('[useLedgerImport]: Pairing Error'), {
        error,
      });
      errorCallback?.(ledgerErrorHandler(error));
    },
    [errorCallback]
  );

  /**
   * Handles successful ledger connection events after opening transport
   */
  const handlePairSuccess = useCallback(
    (deviceId: string) => {
      logger.debug('[useLedgerImport]: Pairing Success', {});
      successCallback?.(deviceId);
      handleCleanUp();
    },
    [successCallback]
  );

  /**
   * searches & pairs to the first found ledger device
   */
  const searchAndPair = useCallback(() => {
    let currentDeviceId = '';
    logger.debug('[useLedgerImport]: searchAndPair', {});
    try {
      const newObserver = TransportBLE.observeState({
        // havnt seen complete or error fire yet but its in the docs so keeping for reporting purposes
        complete: () => {
          logger.debug('[useLedgerImport]: Observer complete', {});
        },
        error: (e: any) => {
          logger.debug('[useLedgerImport]: Observer error ', { e });
        },
        next: async (e: any) => {
          // App is not authorized to use Bluetooth
          if (e.type === 'Unauthorized') {
            logger.debug('[useLedgerImport]: Bluetooth Unauthorized', {});
            if (IS_IOS) {
              await showBluetoothPermissionsAlert();
              return;
            } else {
              await checkAndRequestAndroidBluetooth();
              return;
            }
          }
          // Bluetooth is turned off
          if (e.type === 'PoweredOff') {
            logger.debug('[useLedgerImport]: Bluetooth Powered Off', {});
            await showBluetoothPoweredOffAlert();
            return;
          }
          if (e.available) {
            const newListener = TransportBLE.listen({
              complete: () => {
                logger.debug('[useLedgerImport]: TransportBLE.listen complete', {});
              },
              error: error => {
                logger.error(new RainbowError('[useLedgerImport]: Error Pairing'), { errorMessage: (error as Error).message });
                handlePairError(e);
              },
              next: async e => {
                logger.debug('[useLedgerImport]: TransportBLE.listen next', { e });

                if (e.type === 'add') {
                  const device = e.descriptor;
                  // prevent duplicate alerts
                  if (currentDeviceId === device.id) {
                    logger.debug('[useLedgerImport]: TransportBLE.listen next dupe', { deviceId: device.id });
                    return;
                  }
                  // set the current device id to prevent duplicate alerts
                  currentDeviceId = device.id;

                  logger.debug('[useLedgerImport]: TransportBLE.listen next paired successfully', { deviceId: device.id });
                  handlePairSuccess(device.id);
                } else {
                  logger.debug('[useLedgerImport]: TransportBLE.listen next not paired', { e });
                  handlePairError(e);
                }
              },
            });
            listener.current = newListener;
          }
        },
      });
      observer.current = newObserver;
    } catch (e) {
      logger.error(new RainbowError('[useLedgerImport]: Error Pairing'), { errorMessage: (e as Error).message });
      handlePairError(e as Error);
    }
  }, [handlePairError, handlePairSuccess]);

  /**
   * Init ledger device search
   * Reset conn for testing purposes when sheet is closed
   */

  useEffect(() => {
    const asyncFn = async () => {
      logger.debug('[useLedgerImport]: init device polling', {});

      const isBluetoothEnabled = IS_ANDROID ? await checkAndRequestAndroidBluetooth() : true;
      logger.debug('[useLedgerImport]: bluetooth enabled? ', { isBluetoothEnabled });

      if (isBluetoothEnabled) {
        searchAndPair();
      }
    };

    asyncFn();

    // cleanup
    return () => {
      handleCleanUp();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
