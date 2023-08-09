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
import ScrollPagerWrapper from './ScrollPagerWrapper';
import { SheetHandleFixedToTopHeight, SlackSheet } from '@/components/sheet';
import { BackgroundProvider } from '@/design-system';
import { Dimensions, StatusBar, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useDimensions } from '@/hooks';
import { colors } from '@/styles';

const Swipe = createMaterialTopTabNavigator();

const renderPager = (props: any) => (
  <ScrollPagerWrapper
    {...props}
    {...(android && {
      style: { height: Dimensions.get('window').height },
    })}
  />
);

type RouteParams = {
  AddWalletNavigatorParams: AddWalletSheetParams &
    ImportOrWatchWalletSheetParams;
};

export const AddWalletNavigator = () => {
  const {
    params: { isFirstWallet, type, userData },
  } = useRoute<RouteProp<RouteParams, 'AddWalletNavigatorParams'>>();
  const { height: deviceHeight } = useDimensions();

  const [scrollEnabled, setScrollEnabled] = useState(false);

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
            contentHeight={deviceHeight - SheetHandleFixedToTopHeight}
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
              pager={renderPager}
            >
              <Swipe.Screen
                component={AddWalletSheet}
                initialParams={{ isFirstWallet, userData }}
                name={Routes.ADD_WALLET_SHEET}
                listeners={{
                  focus: () => {
                    setScrollEnabled(!isFirstWallet);
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
          </SlackSheet>
        )}
      </BackgroundProvider>
    </View>
  );
};
