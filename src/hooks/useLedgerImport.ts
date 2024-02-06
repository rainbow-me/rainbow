import TransportBLE from '@ledgerhq/react-native-hw-transport-ble';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DebugContext } from '@/logger/debugContext';
import { logger, RainbowError } from '@/logger';
import { Subscription } from '@ledgerhq/hw-transport';
import { Alert } from 'react-native';
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
      logger.error(new RainbowError('[LedgerImport] - Pairing Error'), {
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
      logger.debug('[LedgerImport] - Pairing Success', {}, DebugContext.ledger);
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

    const newObserver = TransportBLE.observeState({
      // havnt seen complete or error fire yet but its in the docs so keeping for reporting purposes
      complete: (e: any) => {
        logger.debug('[LedgerImport] Observer complete', { e }, DebugContext.ledger);
      },
      error: (e: any) => {
        logger.debug('[LedgerImport] Observer error ', { e }, DebugContext.ledger);
      },
      next: async (e: any) => {
        // App is not authorized to use Bluetooth
        if (e.type === 'Unauthorized') {
          logger.debug('[LedgerImport] - Bluetooth Unauthorized', {}, DebugContext.ledger);
          if (IS_IOS) {
            await showBluetoothPermissionsAlert();
          } else {
            await checkAndRequestAndroidBluetooth();
          }
        }
        // Bluetooth is turned off
        if (e.type === 'PoweredOff') {
          logger.debug('[LedgerImport] - Bluetooth Powered Off', {}, DebugContext.ledger);
          await showBluetoothPoweredOffAlert();
        }
        if (e.available) {
          const newListener = TransportBLE.listen({
            complete: () => {},
            error: error => {
              logger.error(new RainbowError('[Ledger Import] - Error Pairing'), { errorMessage: (error as Error).message });
            },
            next: async e => {
              if (e.type === 'add') {
                const device = e.descriptor;
                // prevent duplicate alerts
                if (currentDeviceId === device.id) {
                  return;
                }
                // set the current device id to prevent duplicate alerts
                currentDeviceId = device.id;

                try {
                  const transport = await TransportBLE.open(device.id);
                  handlePairSuccess(device.id);
                } catch (e) {
                  handlePairError(e as Error);
                  currentDeviceId === '';
                }
              }
            },
          });
          listener.current = newListener;
        }
      },
    });
    observer.current = newObserver;
  }, [handlePairError, handlePairSuccess]);

  /**
   * Init ledger device search
   * Reset conn for testing purposes when sheet is closed
   */

  useEffect(() => {
    const asyncFn = async () => {
      logger.debug('[LedgerImport] - init device polling', {}, DebugContext.ledger);

      const isBluetoothEnabled = IS_ANDROID ? await checkAndRequestAndroidBluetooth() : true;
      logger.debug('[LedgerImport] - bluetooth enabled? ', { isBluetoothEnabled }, DebugContext.ledger);

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
