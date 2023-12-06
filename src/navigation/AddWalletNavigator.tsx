import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import React, { useState } from 'react';
import Routes from '@/navigation/routesNames';
import { deviceUtils } from '@/utils';
import { AddWalletSheet, AddWalletSheetParams } from '@/screens/AddWalletSheet';
import {
  ImportOrWatchWalletSheet,
  ImportOrWatchWalletSheetParams,
} from '@/screens/ImportOrWatchWalletSheet';
import { BackgroundProvider } from '@/design-system';
import { RouteProp, useRoute } from '@react-navigation/native';
import { SimpleSheet } from '@/components/sheet/SimpleSheet';
import ReferralContent, {
  ReferralContentParams,
} from '@/screens/points/content/ReferralContent';

const Swipe = createMaterialTopTabNavigator();

type RouteParams = {
  AddWalletNavigatorParams: AddWalletSheetParams &
    ImportOrWatchWalletSheetParams &
    ReferralContentParams;
};

export const AddWalletNavigator = () => {
  const {
    params: { isFirstWallet, actionType, userData, walletType },
  } = useRoute<RouteProp<RouteParams, 'AddWalletNavigatorParams'>>();

  const [scrollEnabled, setScrollEnabled] = useState(false);

  return (
    <BackgroundProvider color="surfaceSecondary">
      {({ backgroundColor }) => (
        <SimpleSheet
          backgroundColor={backgroundColor as string}
          scrollEnabled={scrollEnabled}
        >
          <Swipe.Navigator
            initialLayout={deviceUtils.dimensions}
            initialRouteName={Routes.ADD_WALLET_SHEET}
            screenOptions={{ swipeEnabled: false }}
            tabBar={() => null}
          >
            <Swipe.Screen
              component={ReferralContent}
              initialParams={{ walletType }}
              name={'ReferralContent'}
              listeners={{
                focus: () => {
                  setScrollEnabled(false);
                },
              }}
            />
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
              initialParams={{ actionType }}
              name={Routes.IMPORT_OR_WATCH_WALLET_SHEET}
              listeners={{
                focus: () => {
                  setScrollEnabled(false);
                },
              }}
            />
          </Swipe.Navigator>
        </SimpleSheet>
      )}
    </BackgroundProvider>
  );
};
