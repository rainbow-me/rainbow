import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import React, { useEffect, useState } from 'react';
import Routes from '@/navigation/routesNames';
import { deviceUtils } from '@/utils';
import { AddWalletSheet, AddWalletSheetParams } from '@/screens/AddWalletSheet';
import {
  ImportOrWatchWalletSheet,
  ImportOrWatchWalletSheetParams,
} from '@/screens/ImportOrWatchWalletSheet';
import { IS_ANDROID } from '@/env';
import { SheetHandleFixedToTopHeight, SlackSheet } from '@/components/sheet';
import { BackgroundProvider } from '@/design-system';
import { StatusBar, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/core';
import { useNavigation } from '@/navigation';

const Swipe = createMaterialTopTabNavigator();

type RouteParams = {
  AddWalletNavigatorParams: AddWalletSheetParams &
    ImportOrWatchWalletSheetParams;
};

export const AddWalletNavigator = () => {
  const {
    params: { isFirstWallet, type, userData },
  } = useRoute<RouteProp<RouteParams, 'AddWalletNavigatorParams'>>();
  const { setParams } = useNavigation();

  const [sheetHeight, setSheetHeight] = useState(0);

  useEffect(() => {
    setParams({ sheetHeight, backgroundOpacity: sheetHeight ? undefined : 1 });
  }, [setParams, sheetHeight]);

  const [scrollEnabled, setScrollEnabled] = useState(false);

  const contentHeight =
    (sheetHeight || deviceUtils.dimensions.height) -
    SheetHandleFixedToTopHeight;

  return (
    // wrapping in View prevents keyboard from pushing up sheet on android
    <View
      style={{
        height: deviceUtils.dimensions.height,
      }}
    >
      <BackgroundProvider color="surfaceSecondary">
        {({ backgroundColor }) => (
          // @ts-expect-error js component
          <SlackSheet
            contentHeight={contentHeight}
            additionalTopPadding={IS_ANDROID ? StatusBar.currentHeight : false}
            backgroundColor={backgroundColor}
            height="100%"
            scrollEnabled={scrollEnabled}
          >
            <Swipe.Navigator
              initialLayout={deviceUtils.dimensions}
              initialRouteName={Routes.ADD_WALLET_SHEET}
              swipeEnabled={false}
              tabBar={() => null}
            >
              <Swipe.Screen
                component={AddWalletSheet}
                initialParams={{ isFirstWallet, setSheetHeight, userData }}
                name={Routes.ADD_WALLET_SHEET}
                listeners={{
                  focus: () => {
                    setScrollEnabled(!isFirstWallet);
                    setParams({ sheetHeight });
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
                    setParams({ sheetHeight: undefined });
                  },
                }}
              />
            </Swipe.Navigator>
          </SlackSheet>
        )}
      </BackgroundProvider>
    </View>
  );
};
