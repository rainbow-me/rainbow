import React, { useState } from 'react';

import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useRoute, type RouteProp } from '@react-navigation/native';

import { SimpleSheet } from '@/components/sheet/SimpleSheet';
import { BackgroundProvider } from '@/design-system';
import Routes from '@/navigation/routesNames';
import { AddWalletSheet } from '@/screens/AddWalletSheet';
import { ChooseWalletGroup } from '@/screens/ChooseWalletGroup';
import { ImportOrWatchWalletSheet } from '@/screens/ImportOrWatchWalletSheet';
import { setActiveRoute } from '@/state/navigation/navigationStore';
import deviceUtils from '@/utils/deviceUtils';

import { type RootStackParamList } from './types';

const Swipe = createMaterialTopTabNavigator();

export const AddWalletNavigator = () => {
  const {
    params: { flowContext = 'in_app', isFirstWallet, type },
  } = useRoute<RouteProp<RootStackParamList, typeof Routes.ADD_WALLET_SHEET>>();

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
              getComponent={() => AddWalletSheet}
              initialParams={{ flowContext, isFirstWallet }}
              name={Routes.ADD_WALLET_SHEET}
              listeners={{
                focus: () => {
                  setActiveRoute(Routes.ADD_WALLET_SHEET);
                  setScrollEnabled(true);
                },
              }}
            />
            <Swipe.Screen
              getComponent={() => ChooseWalletGroup}
              initialParams={{ isFirstWallet }}
              name={Routes.CHOOSE_WALLET_GROUP}
              listeners={{
                focus: () => {
                  setActiveRoute(Routes.CHOOSE_WALLET_GROUP);
                  setScrollEnabled(true);
                },
              }}
            />
            <Swipe.Screen
              getComponent={() => ImportOrWatchWalletSheet}
              initialParams={{ flowContext, type }}
              name={Routes.IMPORT_OR_WATCH_WALLET_SHEET}
              listeners={{
                focus: () => {
                  setActiveRoute(Routes.IMPORT_OR_WATCH_WALLET_SHEET);
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
