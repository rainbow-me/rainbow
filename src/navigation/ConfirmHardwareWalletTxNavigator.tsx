import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import React from 'react';
import Routes from '@/navigation/routesNames';
import { deviceUtils } from '@/utils';
import { IS_ANDROID } from '@/env';
import { SlackSheet } from '@/components/sheet';
import { Box } from '@/design-system';
import { StatusBar } from 'react-native';
import { useDimensions } from '@/hooks';
import { ReconnectHardwareWalletSheet } from '@/screens/ReconnectHardwareWalletSheet';
import { sharedCoolModalTopOffset } from './config';
import * as i18n from '@/languages';

const Swipe = createMaterialTopTabNavigator();
export const TRANSLATIONS = i18n.l.hardware_wallets;
export const CONFIRM_HARDWARE_WALLET_TX_NAVIGATOR_SHEET_HEIGHT = 580;

type Props = {
  children: React.ReactNode;
};

export const SheetContainer = ({ children }: Props) => (
  <Box
    justifyContent="space-between"
    alignItems="center"
    height="full"
    background="surfaceSecondary"
  >
    {children}
  </Box>
);
export const ConfirmHardwareWalletTxNavigator = () => {
  const { isSmallPhone } = useDimensions();

  const contentHeight =
    CONFIRM_HARDWARE_WALLET_TX_NAVIGATOR_SHEET_HEIGHT -
    (!isSmallPhone ? sharedCoolModalTopOffset : 0);

  return (
    // @ts-expect-error JavaScript component
    <SlackSheet
      contentHeight={contentHeight}
      additionalTopPadding={IS_ANDROID ? StatusBar.currentHeight : false}
      height="100%"
      scrollEnabled={false}
      removeTopPadding
    >
      <Box background="surfaceSecondary" height="full">
        <Swipe.Navigator
          initialLayout={deviceUtils.dimensions}
          initialRouteName={Routes.ADD_WALLET_SHEET}
          swipeEnabled={false}
          tabBar={() => null}
        >
          <Swipe.Screen
            component={ReconnectHardwareWalletSheet}
            name={Routes.RECONNECT_HARDWARE_WALLET_SHEET}
          />
        </Swipe.Navigator>
      </Box>
    </SlackSheet>
  );
};
