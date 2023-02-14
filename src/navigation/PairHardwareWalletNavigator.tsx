import React, { useEffect, useState } from 'react';
import { BackgroundProvider } from '@/design-system';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import Routes from '@/navigation/routesNames';
import { PairHardwareWalletIntroSheet } from '@/screens/hardware-wallets/PairHardwareWalletIntroSheet';
import { PairHardwareWalletSearchSheet } from '@/screens/hardware-wallets/PairHardwareWalletSearchSheet';
import { PairHardwareWalletSuccessSheet } from '@/screens/hardware-wallets/PairHardwareWalletSuccessSheet';
import { PairHardwareWalletSigningSheet } from '@/screens/hardware-wallets/PairHardwareWalletSigningSheet';
import { PairHardwareWalletErrorSheet } from '@/screens/hardware-wallets/PairHardwareWalletErrorSheet';
import { NanoXDeviceAnimation } from '@/screens/hardware-wallets/components/NanoXDeviceAnimation';
import { useDimensions } from '@/hooks';
import { SimpleSheet } from '@/components/sheet/SimpleSheet';
import { RouteProp, useRoute } from '@react-navigation/native';
import { analyticsV2 } from '@/analytics';

const Swipe = createMaterialTopTabNavigator();

type PairHardwareWalletNavigatorParams = {
  entryPoint: string;
  isFirstWallet: boolean;
};

type RouteParams = {
  PairHardwareWalletNavigatorParams: PairHardwareWalletNavigatorParams;
};

export const PairHardwareWalletNavigator = () => {
  const { params } = useRoute<
    RouteProp<RouteParams, 'PairHardwareWalletNavigatorParams'>
  >();

  const [currentRouteName, setCurrentRouteName] = useState(
    Routes.PAIR_HARDWARE_WALLET_SIGNING_SHEET
  );

  const { height, width } = useDimensions();

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
              component={PairHardwareWalletSuccessSheet}
              name={Routes.PAIR_HARDWARE_WALLET_SUCCESS_SHEET}
              listeners={{
                focus: () => {
                  setCurrentRouteName(
                    Routes.PAIR_HARDWARE_WALLET_SUCCESS_SHEET
                  );
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
            <Swipe.Screen
              component={PairHardwareWalletErrorSheet}
              name={Routes.PAIR_HARDWARE_WALLET_ERROR_SHEET}
              listeners={{
                focus: () => {
                  setCurrentRouteName(Routes.PAIR_HARDWARE_WALLET_ERROR_SHEET);
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
            />
          )}
        </SimpleSheet>
      )}
    </BackgroundProvider>
  );
};
