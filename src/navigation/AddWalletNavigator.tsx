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
import { useDimensions } from '@/hooks';

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

  const [sheetHeight, setSheetHeight] = useState<number | undefined>(0);
  const [backgroundOpacity, setBackgroundOpacity] = useState(0);
  const { height: deviceHeight } = useDimensions();

  // console.log(deviceHeight);

  useEffect(
    () =>
      setParams({
        sheetHeight,
      }),
    [setParams, sheetHeight]
  );

  useEffect(
    () =>
      setParams({
        backgroundOpacity: 1,
      }),
    [backgroundOpacity, setParams]
  );

  const [scrollEnabled, setScrollEnabled] = useState(false);

  const contentHeight =
    (sheetHeight || deviceHeight) - SheetHandleFixedToTopHeight;

  return (
    // wrapping in View prevents keyboard from pushing up sheet on android
    <View
      style={{
        height: deviceHeight,
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
                    setBackgroundOpacity(0.7);
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
                    setSheetHeight(undefined);
                    setBackgroundOpacity(1);
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
