import React, { useEffect, useState } from 'react';
import { BackgroundProvider } from '@/design-system';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { PairHardwareWalletIntroSheet } from '@/screens/hardware-wallets/PairHardwareWalletIntroSheet';
import { PairHardwareWalletSearchSheet } from '@/screens/hardware-wallets/PairHardwareWalletSearchSheet';
import { PairHardwareWalletSigningSheet } from '@/screens/hardware-wallets/PairHardwareWalletSigningSheet';
import { NanoXDeviceAnimation } from '@/screens/hardware-wallets/components/NanoXDeviceAnimation';
import { useDimensions } from '@/hooks';
import { SimpleSheet } from '@/components/sheet/SimpleSheet';
import { atom, useRecoilState } from 'recoil';
import Routes from '@/navigation/routesNames';
import { RouteProp, useRoute } from '@react-navigation/core';
import { analyticsV2 } from '@/analytics';

const Swipe = createMaterialTopTabNavigator();

type PairHardwareWalletNavigatorParams = {
  entryPoint: string;
  isFirstWallet: boolean;
};

type RouteParams = {
  PairHardwareWalletNavigatorParams: PairHardwareWalletNavigatorParams;
};

// atoms used for navigator state
export const LedgerImportDeviceIdAtom = atom({
  default: '',
  key: 'ledgerImportDeviceId',
});

export function PairHardwareWalletNavigator() {
  const { params } = useRoute<
    RouteProp<RouteParams, 'PairHardwareWalletNavigatorParams'>
  >();
  const { height, width } = useDimensions();

  const [currentRouteName, setCurrentRouteName] = useState<string>(
    Routes.PAIR_HARDWARE_WALLET_INTRO_SHEET
  );

  const [deviceId, setDeviceId] = useRecoilState(LedgerImportDeviceIdAtom);

  // reset navigator state on unmount
  useEffect(() => {
    return () => {
      setDeviceId('');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(
    () => analyticsV2.track(analyticsV2.event.pairHwWalletNavEntered, params),
    []
  );

  const onDismiss = () =>
    analyticsV2.track(analyticsV2.event.pairHwWalletNavExited, {
      step: currentRouteName,
      ...params,
    });

  return (
    <BackgroundProvider color="surfaceSecondary">
      {({ backgroundColor }) => (
        <SimpleSheet
          backgroundColor={backgroundColor as string}
          onDismiss={onDismiss}
          scrollEnabled={false}
        >
          <Swipe.Navigator
            initialLayout={{ height, width }}
            initialRouteName={currentRouteName}
            sceneContainerStyle={{ backgroundColor }}
            screenOptions={{ swipeEnabled: false, lazy: true }}
            tabBar={() => null}
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
