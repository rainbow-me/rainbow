import TransportBLE from '@ledgerhq/react-native-hw-transport-ble';
import { useCallback, useEffect, useState } from 'react';
import { DebugContext } from '@/logger/debugContext';
import { logger, RainbowError } from '@/logger';
import * as i18n from '@/languages';
import { Subscription } from '@ledgerhq/hw-transport';
import { Alert } from 'react-native';
import {
  checkAndRequestAndroidBluetooth,
  showBluetoothPermissionsAlert,
  showBluetoothPoweredOffAlert,
} from '@/utils/bluetoothPermissions';
import { IS_ANDROID, IS_IOS } from '@/env';

enum LEDGER_IMPORT_STATUS {
  SEARCHING = 'SEARCHING',
  FOUND = 'FOUND',
  PAIRING = 'PAIRING',
  PAIRED = 'PAIRED',
  ERROR = 'ERROR',
}

/**
 * React hook used for checking ledger connections and handling connnection error states
 */
export function useLedgerImport({
  errorCallback,
  successCallback,
}: {
  successCallback?: (deviceId: string) => void;
  errorCallback?: () => void;
}) {
  const [pairingStatus, setPairingStatus] = useState<LEDGER_IMPORT_STATUS>(
    LEDGER_IMPORT_STATUS.SEARCHING
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [observer, setObserverSubscription] = useState<Subscription | null>(
    null
  );
  const [listener, setListenerSubscription] = useState<Subscription | null>(
    null
  );

  /**
   * Handles local error handling for useLedgerStatusCheck
   */
  const handlePairError = useCallback(
    (error: Error) => {
      setPairingStatus(LEDGER_IMPORT_STATUS.ERROR);
      logger.error(new RainbowError('[LedgerImport] - Pairing Error'), {
        error,
      });
      errorCallback?.();
    },
    [errorCallback]
  );

  /**
   * Handles successful ledger connection events after opening transport
   */
  const handlePairSuccess = useCallback(
    (deviceId: string) => {
      logger.debug('[LedgerImport] - Pairing Success', {}, DebugContext.ledger);
      setPairingStatus(LEDGER_IMPORT_STATUS.PAIRED);
      setErrorMessage(null);
      successCallback?.(deviceId);
    },
    [successCallback]
  );

  /**
   * Opens a transport between the phone and the ledger device
   */
  const openLedgerTransport = useCallback(async (deviceId: string) => {
    try {
      // we dont need the transport rn other than to pair to the device
      const transport = await TransportBLE.open(deviceId);
    } catch (e) {
      logger.debug('error opening transport ', {}, DebugContext.ledger);
    }
  }, []);

  /**
   * searches & pairs to the first found ledger device
   */
  const searchAndPair = useCallback(() => {
    setPairingStatus(LEDGER_IMPORT_STATUS.SEARCHING);
    let currentDeviceId = '';

    const newObserver = TransportBLE.observeState({
      // havnt seen complete or error fire yet but its in the docs so keeping for reporting purposes
      complete: (e: any) => {
        logger.debug(
          '[LedgerImport] Observer complete',
          { e },
          DebugContext.ledger
        );
      },
      error: (e: any) => {
        logger.debug(
          '[LedgerImport] Observer error ',
          { e },
          DebugContext.ledger
        );
        setPairingStatus(LEDGER_IMPORT_STATUS.ERROR);
      },
      next: async (e: any) => {
        // App is not authorized to use Bluetooth
        if (e.type === 'Unauthorized') {
          logger.debug(
            '[LedgerImport] - Bluetooth Unauthorized',
            {},
            DebugContext.ledger
          );
          if (IS_IOS) {
            await showBluetoothPermissionsAlert();
          } else {
            await checkAndRequestAndroidBluetooth();
          }
        }
        // Bluetooth is turned off
        if (e.type === 'PoweredOff') {
          logger.debug(
            '[LedgerImport] - Bluetooth Powered Off',
            {},
            DebugContext.ledger
          );
          await showBluetoothPoweredOffAlert();
        }
        if (e.available) {
          const newListener = TransportBLE.listen({
            complete: () => {},
            error: error => {
              logger.debug('error pairing ', { error }, DebugContext.ledger);
              setPairingStatus(error);
            },
            next: async e => {
              if (e.type === 'add') {
                const device = e.descriptor;
                // prevent duplicate alerts
                if (currentDeviceId === device.id) {
                  return null;
                }
                // set the current device id to prevent duplicate alerts
                setPairingStatus(LEDGER_IMPORT_STATUS.FOUND);
                currentDeviceId = device.id;

                /*
                Alert.alert(
                  'device found',
                  `do u wanna connect to ${device.name} - ${device.id}`,
                  [
                    {
                      onPress: () => {
                        // if a user cancels this how do we want to handle?
                        return null;
                      },
                      style: 'cancel',
                      text: 'no',
                    },
                    {
                      onPress: async () => {
                        setPairingStatus(LEDGER_IMPORT_STATUS.PAIRING);
                        try {
                          // should i retry at this point?
                          await openLedgerTransport(device.id);
                          handlePairSuccess(device.id);
                        } catch (e) {
                          logger.debug(
                            'error pairing ',
                            {},
                            DebugContext.ledger
                          );
                          handlePairError(e as Error);
                        }
                      },
                      text: 'yes/pair',
                    },
                  ]
                );
                */
                setPairingStatus(LEDGER_IMPORT_STATUS.PAIRING);
                try {
                  // should i retry at this point?
                  await openLedgerTransport(device.id);
                  handlePairSuccess(device.id);
                } catch (e) {
                  logger.debug('error pairing ', {}, DebugContext.ledger);
                  handlePairError(e as Error);
                }
              } else {
                Alert.alert('error connecting', JSON.stringify(e, null, 2));
              }
            },
          });
          setListenerSubscription(newListener);
        }
      },
    });
    setObserverSubscription(newObserver);
  }, [handlePairError, handlePairSuccess, openLedgerTransport]);

  /**
   * Init ledger device search
   * Reset conn for testing purposes when sheet is closed
   */

  useEffect(() => {
    const asyncFn = async () => {
      logger.debug(
        '[LedgerImport] - init device polling',
        {},
        DebugContext.ledger
      );
      let isBluetothEnabled = true;
      if (IS_ANDROID) {
        isBluetothEnabled = await checkAndRequestAndroidBluetooth();
      }
      logger.debug(
        '[LedgerImport] - bluetooth enabled? ',
        { isBluetothEnabled },
        DebugContext.ledger
      );
      if (isBluetothEnabled) {
        searchAndPair();
      }
    };

    asyncFn();

    // cleanup
    return () => {
      observer?.unsubscribe();
      listener?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { pairingStatus, errorMessage };
}
