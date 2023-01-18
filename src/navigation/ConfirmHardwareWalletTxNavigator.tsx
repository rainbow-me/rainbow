import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import React, { useState } from 'react';
import Routes from '@/navigation/routesNames';
import { deviceUtils } from '@/utils';
import { AddWalletSheet, AddWalletSheetParams } from '@/screens/AddWalletSheet';
import {
  ImportOrWatchWalletSheet,
  ImportOrWatchWalletSheetParams,
} from '@/screens/ImportOrWatchWalletSheet';
import { IS_ANDROID } from '@/env';
import { SheetHandleFixedToTopHeight, SlackSheet } from '@/components/sheet';
import { BackgroundProvider, Box } from '@/design-system';
import { StatusBar } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/core';
import { useDimensions } from '@/hooks';
import { ReconnectHardwareWalletSheet } from '@/screens/ReconnectHardwareWalletSheet';
import { NanoXDeviceAnimation } from '@/components/hardware-wallets/NanoXDeviceAnimation';
import { sharedCoolModalTopOffset } from './config';

const Swipe = createMaterialTopTabNavigator();

type RouteParams = {
  AddWalletNavigatorParams: AddWalletSheetParams &
    ImportOrWatchWalletSheetParams;
};

export const contentHeight =
  580 - (!deviceUtils.isSmallPhone ? sharedCoolModalTopOffset : 0);

export const ConfirmHardwareWalletTxNavigator = () => {
  const { params } = useRoute<
    RouteProp<RouteParams, 'AddWalletNavigatorParams'>
  >();
  const { height: deviceHeight } = useDimensions();

  const [currentRouteName, setCurrentRouteName] = useState(
    Routes.RECONNECT_HARDWARE_WALLET_SHEET
  );

  return (
    // @ts-expect-error js component
    <SlackSheet
      contentHeight={deviceHeight - SheetHandleFixedToTopHeight}
      additionalTopPadding={IS_ANDROID ? StatusBar.currentHeight : false}
      height="100%"
      scrollEnabled={false}
      removeTopPadding
    >
      <Box height="full" background="surfaceSecondary">
        <Swipe.Navigator
          initialLayout={deviceUtils.dimensions}
          initialRouteName={Routes.ADD_WALLET_SHEET}
          swipeEnabled={false}
          tabBar={() => null}
        >
          <Swipe.Screen
            component={ReconnectHardwareWalletSheet}
            initialParams={{}}
            name={Routes.RECONNECT_HARDWARE_WALLET_SHEET}
            listeners={{
              focus: () => {
                setCurrentRouteName(Routes.RECONNECT_HARDWARE_WALLET_SHEET);
              },
            }}
          />
        </Swipe.Navigator>
      </Box>
    </SlackSheet>
  );
};
