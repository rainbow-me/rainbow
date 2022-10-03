import { useCallback, useEffect, useState } from 'react';
import { Alert, PermissionsAndroid } from 'react-native';
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble';
import { Subscription } from '@ledgerhq/hw-transport';
import { IS_ANDROID } from '@/env';

export default function usePairLedgerBluetooth() {
  const requestBLEPermissions = async () => {
    try {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]);
      console.log('android bluetooth permissions requested succesfully!');
    } catch (e) {
      console.log('android bluetooth permissions error: ', e);
    }
  };
  const [device, setDevice] = useState();
  const [observe, setObserve] = useState<Subscription>();
  const [listen, setListen] = useState<Subscription>();

  useEffect(() => {
    const handlePair = () => {
      const _observe = TransportBLE.observeState({
        next: (e: any) => {
          if (e.available) {
            console.log('observing: ', e);
            const _listen = TransportBLE.listen({
              complete: () => {},
              next: e => {
                if (!device) {
                  if (e.type === 'add') {
                    const _device = e.descriptor;
                    setDevice(_device);
                    console.log('device found:', {
                      deviceId: _device.id,
                      name: _device.name,
                    });
                    Alert.alert('Device Found!', _device.name);
                  }
                }
              },
              error: error => {
                console.log('transport listen error: ', error);
                if (IS_ANDROID) {
                  requestBLEPermissions();
                }
              },
            });
            setListen(_listen);
          } else {
            if (e.type === 'PoweredOff') {
              console.log('bluetooth is turned off');
            }
          }
        },
        complete: () => {},
        error: () => {},
      });
      setObserve(_observe);
    };
    handlePair();
    return () => {
      console.log('unsubscribing:');
      observe?.unsubscribe();
      listen?.unsubscribe();
    };
  }, []);

  return {
    device,
  };
}
