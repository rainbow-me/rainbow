import { useCallback, useEffect, useState } from 'react';
import { Alert, PermissionsAndroid } from 'react-native';
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble';
import Transport, { Subscription } from '@ledgerhq/hw-transport';
import { IS_ANDROID } from '@/env';
import AppEth from '@ledgerhq/hw-app-eth';

enum CONNECTION_STATUS {
  NONE = 'NONE',
  SEARCHING = 'SEARCHING',
  FOUND = 'FOUND',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
}

function usePairLedgerBluetooth() {
  //   const { handlePressImportButton, handleSetSeedPhrase } = useImportingWallet();

  const importHardwareWallet = useCallback(
    async device => {
      console.log('********* importing hw wallet: ', device.id);
      try {
        // handleSetSeedPhrase(deviceId);
        // handlePressImportButton(null, deviceId, null, null);
        const _transport = await TransportBLE.open(device);
        console.log('*** - opened device: ', device.id);
        setTransport(_transport);
        console.log('successfully ran import ahrdware wallet code');
        setStatus(CONNECTION_STATUS.CONNECTED);
      } catch (error) {
        Alert.alert('failure to import');
        // logger.log('error importing hw wallet', error);
        console.log('&&&&&&&&&& failed to import: ', error);
        setStatus(CONNECTION_STATUS.NONE);
      }
    },
    [
      // handlePressImportButton,
      // handleSetSeedPhrase
    ]
  );
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
  const [status, setStatus] = useState(CONNECTION_STATUS.NONE);
  const [device, setDevice] = useState();
  const [observe, setObserve] = useState<Subscription>();
  const [listen, setListen] = useState<Subscription>();
  const [transport, setTransport] = useState();
  // const [hdWallet, getHdWallet] = useState();

  useEffect(() => {
    const signTestMessage = async (t: Transport) => {
      const eth = new AppEth(t);
      console.log('new eth app:', eth);
      // const path = "44'/60'/0'/0/0";
      //   const { address } = await eth.getAddress(path, true);
      eth
        .signPersonalMessage(
          "44'/60'/0'/0/0",
          Buffer.from('Nico testtttttt').toString('hex')
        )
        .then((result: { [x: string]: number }) => {
          console.log('SO far so good:');
          const v = result['v'] - 27;
          let w = v.toString(16);
          if (w.length < 2) {
            w = '0' + w;
          }
          console.log('test ran correctly');
          console.log('Signature 0x' + result['r'] + result['s'] + w);
        });
    };
    if (transport !== undefined) {
      signTestMessage(transport);
    }
  }, [transport]);

  useEffect(() => {
    const handlePair = () => {
      const _observe = TransportBLE.observeState({
        next: (e: any) => {
          if (e.available) {
            console.log('observing: ', e);
            const _listen = TransportBLE.listen({
              complete: () => null,
              next: e => {
                if (!device) {
                  if (e.type === 'add') {
                    const _device = e.descriptor;
                    setDevice(_device);
                    setStatus(CONNECTION_STATUS.FOUND);
                    Alert.alert(
                      'Device Found!',
                      `${_device.id} - ${_device.name}`,
                      [
                        {
                          onPress: () => {
                            setDevice(undefined);
                            setStatus(CONNECTION_STATUS.NONE);
                          },
                          style: 'cancel',
                          text: 'Cancel',
                        },
                        {
                          onPress: async () => {
                            setStatus(CONNECTION_STATUS.CONNECTING);
                            importHardwareWallet(_device);
                          },
                          text: 'Connect',
                        },
                      ]
                    );
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
        complete: () => null,
        error: () => null,
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
    status,
  };
}

export { usePairLedgerBluetooth };
