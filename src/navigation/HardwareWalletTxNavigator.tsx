import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import React from 'react';
import Routes from '@/navigation/routesNames';
import { BackgroundProvider } from '@/design-system';
import { useDimensions } from '@/hooks';
import { PairHardwareWalletAgainSheet } from '@/screens/hardware-wallets/PairHardwareWalletAgainSheet';
import { SimpleSheet } from '@/components/sheet/SimpleSheet';
import { PairHardwareWalletEthAppErrorSheet } from '@/screens/hardware-wallets/PairHardwareWalletEthAppErrorSheet';
import { PairHardwareWalletLockedErrorSheet } from '@/screens/hardware-wallets/PairHardwareWalletLockedErrorSheet';

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
            initialRouteName={Routes.PAIR_HARDWARE_WALLET_AGAIN_SHEET}
            swipeEnabled={false}
            sceneContainerStyle={{ backgroundColor: backgroundColor }}
            tabBar={() => null}
          >
            <Swipe.Screen
              component={PairHardwareWalletAgainSheet}
              name={Routes.PAIR_HARDWARE_WALLET_AGAIN_SHEET}
            />
            <Swipe.Screen
              component={PairHardwareWalletEthAppErrorSheet}
              name={Routes.PAIR_HARDWARE_WALLET_ETH_APP_ERROR_SHEET}
            />
            <Swipe.Screen
              component={PairHardwareWalletLockedErrorSheet}
              name={Routes.PAIR_HARDWARE_WALLET_LOCKED_ERROR_SHEET}
            />
          </Swipe.Navigator>
        </SimpleSheet>
      )}
    </BackgroundProvider>
  );
};
