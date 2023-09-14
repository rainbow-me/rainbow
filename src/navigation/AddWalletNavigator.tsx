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
import { getDeviceRadius } from './bottom-sheet-navigator/utils/getDeviceRadius';
import { SimpleSheet } from '@/components/sheet/SimpleSheet';

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
  const radius = getDeviceRadius();
  const [scrollEnabled, setScrollEnabled] = useState(false);
  // Androids needs a little extra treatment with nested navigators styles
  const androidAdditionalNavigatorProps = {
    style: {
      backgroundColor: 'transparent',
    },
    pagerStyle: {
      backgroundColor: 'transparent',
    },
    sceneContainerStyle: {
      backgroundColor: 'transparent',
      borderTopLeftRadius: radius,
      borderTopRightRadius: radius,
    },
  };

  return (
    <BackgroundProvider color="surfaceSecondary">
      {({ backgroundColor }) => (
        <StaticBottomSheet
          scrollable={scrollEnabled}
          fullWindowOverlay={false}
          contentContainerStyle={{ flex: 1 }}
          style={{ paddingTop: 0 }}
          backgroundStyle={{ backgroundColor }}
        >
          <Swipe.Navigator
            initialRouteName={Routes.ADD_WALLET_SHEET}
            screenOptions={{ swipeEnabled: false }}
            tabBar={() => null}
            {...(IS_ANDROID ? androidAdditionalNavigatorProps : {})}
          >
            <Swipe.Screen
              component={AddWalletSheet}
              initialParams={{ isFirstWallet, userData }}
              name={Routes.ADD_WALLET_SHEET}
              listeners={{
                focus: () => {
                  setScrollEnabled(true);
                },
              }}
            />
            <Swipe.Screen
              component={ImportOrWatchWalletSheet}
              initialParams={{ type }}
              name={Routes.IMPORT_OR_WATCH_WALLET_SHEET}
              listeners={{
                focus: () => {
                  setScrollEnabled(false);
                },
              }}
            />
          </Swipe.Navigator>
        </StaticBottomSheet>
      )}
    </BackgroundProvider>
  );
};
