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
import { BackgroundProvider, useBackgroundColor } from '@/design-system';
import { ColorValue, StatusBar, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useDimensions } from '@/hooks';
import { StaticBottomSheet } from './bottom-sheet-navigator/components/StaticBottomSheet';
import { useTheme } from '@/theme';

const Swipe = createMaterialTopTabNavigator();

type RouteParams = {
  AddWalletNavigatorParams: AddWalletSheetParams &
    ImportOrWatchWalletSheetParams;
};

export const AddWalletNavigator = () => {
  const {
    params: { isFirstWallet, type, userData },
  } = useRoute<RouteProp<RouteParams, 'AddWalletNavigatorParams'>>();
  const backgroundColor = useBackgroundColor('surfaceSecondary');

  return (
    <StaticBottomSheet
      scrollable
      fullWindowOverlay={false}
      contentContainerStyle={{ flex: 1 }}
      backgroundStyle={{ backgroundColor }}
    >
      <Swipe.Navigator
        initialLayout={deviceUtils.dimensions}
        initialRouteName={Routes.ADD_WALLET_SHEET}
        screenOptions={{ swipeEnabled: false }}
        tabBar={() => null}
      >
        <Swipe.Screen
          component={AddWalletSheet}
          initialParams={{ isFirstWallet, userData }}
          name={Routes.ADD_WALLET_SHEET}
        />
        <Swipe.Screen
          component={ImportOrWatchWalletSheet}
          initialParams={{ type }}
          name={Routes.IMPORT_OR_WATCH_WALLET_SHEET}
        />
      </Swipe.Navigator>
    </StaticBottomSheet>
  );
};
