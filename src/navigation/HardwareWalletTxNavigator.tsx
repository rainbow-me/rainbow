import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import React from 'react';
import Routes from '@/navigation/routesNames';
import { BackgroundProvider } from '@/design-system';
import { useDimensions } from '@/hooks';
import { PairHardwareWalletAgainSheet } from '@/screens/hardware-wallets/PairHardwareWalletAgainSheet';
import { PairHardwareWalletErrorSheet } from '@/screens/hardware-wallets/PairHardwareWalletErrorSheet';
import { SimpleSheet } from '@/components/sheet/SimpleSheet';

const Swipe = createMaterialTopTabNavigator();
export const HARDWARE_WALLET_TX_NAVIGATOR_SHEET_HEIGHT = 534;

export const HardwareWalletTxNavigator = () => {
  const { width, height } = useDimensions();

  return (
    <BackgroundProvider color="surfaceSecondary">
      {({ backgroundColor }) => (
        <SimpleSheet
          backgroundColor={backgroundColor as string}
          customHeight={HARDWARE_WALLET_TX_NAVIGATOR_SHEET_HEIGHT}
          scrollEnabled={false}
        >
          <Swipe.Navigator
            initialLayout={{ width, height }}
            initialRouteName={Routes.PAIR_HARDWARE_WALLET_ERROR_SHEET}
            swipeEnabled={false}
            sceneContainerStyle={{ backgroundColor: backgroundColor }}
            tabBar={() => null}
          >
            <Swipe.Screen
              component={PairHardwareWalletAgainSheet}
              name={Routes.PAIR_HARDWARE_WALLET_AGAIN_SHEET}
            />
            <Swipe.Screen
              component={PairHardwareWalletErrorSheet}
              name={Routes.PAIR_HARDWARE_WALLET_ERROR_SHEET}
            />
          </Swipe.Navigator>
        </SimpleSheet>
      )}
    </BackgroundProvider>
  );
};
