import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import React, { useState } from 'react';
import Routes from '@/navigation/routesNames';
import { deviceUtils } from '@/utils';
import { AddWalletSheet, AddWalletSheetParams } from '@/screens/AddWalletSheet';
import { ImportOrWatchWalletSheet, ImportOrWatchWalletSheetParams } from '@/screens/ImportOrWatchWalletSheet';
import { BackgroundProvider } from '@/design-system';
import { RouteProp, useRoute } from '@react-navigation/native';
import { SimpleSheet } from '@/components/sheet/SimpleSheet';

const Swipe = createMaterialTopTabNavigator();

type RouteParams = {
  AddWalletNavigatorParams: AddWalletSheetParams & ImportOrWatchWalletSheetParams;
};

export const AddWalletNavigator = () => {
  const {
    params: { isFirstWallet, type },
  } = useRoute<RouteProp<RouteParams, 'AddWalletNavigatorParams'>>();

  const [scrollEnabled, setScrollEnabled] = useState(false);

  return (
    <BackgroundProvider color="surfaceSecondary">
      {({ backgroundColor }) => (
        <SimpleSheet backgroundColor={backgroundColor as string} useAdditionalTopPadding scrollEnabled={scrollEnabled}>
          <Swipe.Navigator
            initialLayout={deviceUtils.dimensions}
            initialRouteName={Routes.ADD_WALLET_SHEET}
            screenOptions={{ swipeEnabled: false }}
            tabBar={() => null}
          >
            <Swipe.Screen
              component={AddWalletSheet}
              initialParams={{ isFirstWallet }}
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
        </SimpleSheet>
      )}
    </BackgroundProvider>
  );
};
