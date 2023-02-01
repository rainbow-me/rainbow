import React, { useCallback, useEffect, useState } from 'react';
import { BackgroundProvider } from '@/design-system';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { PairHardwareWalletIntroSheet } from '@/screens/hardware-wallets/PairHardwareWalletIntroSheet';
import { PairHardwareWalletSearchSheet } from '@/screens/hardware-wallets/PairHardwareWalletSearchSheet';
import { PairHardwareWalletSigningSheet } from '@/screens/hardware-wallets/PairHardwareWalletSigningSheet';
import { PairHardwareWalletErrorSheet } from '@/screens/hardware-wallets/PairHardwareWalletErrorSheet';
import { NanoXDeviceAnimation } from '@/screens/hardware-wallets/components/NanoXDeviceAnimation';
import { useDimensions } from '@/hooks';
import { SimpleSheet } from '@/components/sheet/SimpleSheet';
import { atom, useRecoilState } from 'recoil';
import { LEDGER_ERROR_CODES } from '@/utils/ledger';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { Alert } from 'react-native';
import { useLedgerConnect } from '@/hooks/useLedgerConnect';

const Swipe = createMaterialTopTabNavigator();

// atoms used for navigator state
export const LedgerImportDeviceIdAtom = atom({
  default: '',
  key: 'ledgerImportDeviceId',
});
export const LedgerImportReadyForPollingAtom = atom({
  default: false,
  key: 'ledgerImportReadyForPolling',
});

export function PairHardwareWalletNavigator() {
  const { height, width } = useDimensions();
  const { navigate } = useNavigation();
  const [currentRouteName, setCurrentRouteName] = useState(
    Routes.PAIR_HARDWARE_WALLET_INTRO_SHEET
  );
  const [sheetBeforeError, setSheetBeforeError] = useState(
    Routes.PAIR_HARDWARE_WALLET_SUCCESS_SHEET
  );

  const [readyForPolling, setReadyForPolling] = useRecoilState(
    LedgerImportReadyForPollingAtom
  );
  const [deviceId, setDeviceId] = useRecoilState(LedgerImportDeviceIdAtom);

  const successCallback = useCallback(
    (deviceId: string) => {
      console.log('sucess callback');
      if (currentRouteName === Routes.PAIR_HARDWARE_WALLET_ERROR_SHEET) {
        navigate(sheetBeforeError);
      }
    },
    [currentRouteName, navigate, sheetBeforeError]
  );

  const errorCallback = useCallback(
    (errorType: LEDGER_ERROR_CODES) => {
      console.log('error callback', errorType);
      if (
        errorType === LEDGER_ERROR_CODES.NO_ETH_APP ||
        errorType === LEDGER_ERROR_CODES.OFF_OR_LOCKED
      ) {
        if (currentRouteName !== Routes.PAIR_HARDWARE_WALLET_ERROR_SHEET) {
          setSheetBeforeError(currentRouteName);
        }
        navigate(Routes.PAIR_HARDWARE_WALLET_ERROR_SHEET, {
          errorType,
          runChecksLocally: true,
        });
      } else {
        console.log('unhandled errorType', errorType);

        Alert.alert('Error', 'Something went wrong. Please try again later.');
      }
    },
    [currentRouteName, navigate]
  );

  const { connectionStatus } = useLedgerConnect({
    readyForPolling,
    deviceId,
    successCallback,
    errorCallback,
  });

  // reset navigator state on unmount
  useEffect(() => {
    return () => {
      setDeviceId('');
      setReadyForPolling(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <BackgroundProvider color="surfaceSecondary">
      {({ backgroundColor }) => (
        <SimpleSheet
          backgroundColor={backgroundColor as string}
          scrollEnabled={false}
        >
          <Swipe.Navigator
            initialLayout={{ height, width }}
            initialRouteName={currentRouteName}
            sceneContainerStyle={{ backgroundColor }}
            swipeEnabled={false}
            tabBar={() => null}
            lazy
          >
            <Swipe.Screen
              component={PairHardwareWalletIntroSheet}
              name={Routes.PAIR_HARDWARE_WALLET_INTRO_SHEET}
              listeners={{
                focus: () => {
                  setCurrentRouteName(Routes.PAIR_HARDWARE_WALLET_INTRO_SHEET);
                },
              }}
            />
            <Swipe.Screen
              component={PairHardwareWalletSearchSheet}
              name={Routes.PAIR_HARDWARE_WALLET_SEARCH_SHEET}
              listeners={{
                focus: () => {
                  setCurrentRouteName(Routes.PAIR_HARDWARE_WALLET_SEARCH_SHEET);
                },
              }}
            />
            <Swipe.Screen
              component={PairHardwareWalletErrorSheet}
              name={Routes.PAIR_HARDWARE_WALLET_ERROR_SHEET}
              listeners={{
                focus: () => {
                  setCurrentRouteName(Routes.PAIR_HARDWARE_WALLET_ERROR_SHEET);
                },
              }}
            />
            <Swipe.Screen
              component={PairHardwareWalletSigningSheet}
              name={Routes.PAIR_HARDWARE_WALLET_SIGNING_SHEET}
              listeners={{
                focus: () => {
                  setCurrentRouteName(
                    Routes.PAIR_HARDWARE_WALLET_SIGNING_SHEET
                  );
                },
              }}
            />
          </Swipe.Navigator>
          {(currentRouteName === Routes.PAIR_HARDWARE_WALLET_INTRO_SHEET ||
            currentRouteName === Routes.PAIR_HARDWARE_WALLET_SEARCH_SHEET) && (
            <NanoXDeviceAnimation
              state={
                currentRouteName === Routes.PAIR_HARDWARE_WALLET_SEARCH_SHEET
                  ? 'loading'
                  : 'idle'
              }
              isConnected={deviceId !== ''}
            />
          )}
        </SimpleSheet>
      )}
    </BackgroundProvider>
  );
}
