import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import React from 'react';
import Routes from '@/navigation/routesNames';
import { IS_ANDROID } from '@/env';
import { SlackSheet } from '@/components/sheet';
import { BackgroundProvider } from '@/design-system';
import { StatusBar } from 'react-native';
import { useDimensions } from '@/hooks';
import { PairHardwareWalletAgainSheet } from '@/screens/PairHardwareWalletAgainSheet';
import { sharedCoolModalTopOffset } from './config';
import { PairHardwareWalletErrorSheet } from '@/screens/PairHardwareWalletErrorSheet';
import { SheetContainer } from '@/components/sheet/SheetContainer';

const Swipe = createMaterialTopTabNavigator();
export const HARDWARE_WALLET_TX_NAVIGATOR_SHEET_HEIGHT = 580;

export const HardwareWalletTxNavigator = () => {
  const { isSmallPhone, width, height } = useDimensions();

  const contentHeight =
    HARDWARE_WALLET_TX_NAVIGATOR_SHEET_HEIGHT -
    (!isSmallPhone ? sharedCoolModalTopOffset : 0);

  return (
    <BackgroundProvider color="surfaceSecondary">
      {({ backgroundColor }) => (
        // @ts-expect-error JavaScript component
        <SlackSheet
          contentHeight={contentHeight}
          additionalTopPadding={IS_ANDROID ? StatusBar.currentHeight : false}
          height="100%"
          scrollEnabled={false}
          removeTopPadding
          backgroundColor={backgroundColor}
        >
          <SheetContainer
            sheetHeight={HARDWARE_WALLET_TX_NAVIGATOR_SHEET_HEIGHT}
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
          </SheetContainer>
        </SlackSheet>
      )}
    </BackgroundProvider>
  );
};
