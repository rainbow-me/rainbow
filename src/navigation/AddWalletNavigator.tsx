import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import React, { useState } from 'react';
import Routes from '@/navigation/routesNames';
import { deviceUtils } from '@/utils';
import { AddWalletSheet } from '@/screens/AddWalletSheet';
import { ChooseWalletGroup } from '@/screens/ChooseWalletGroup';
import { ImportOrWatchWalletSheet } from '@/screens/ImportOrWatchWalletSheet';
import { BackgroundProvider } from '@/design-system';
import { RouteProp, useRoute } from '@react-navigation/native';
import { SimpleSheet } from '@/components/sheet/SimpleSheet';
import { RootStackParamList } from './types';

const Swipe = createMaterialTopTabNavigator();

export const AddWalletNavigator = () => {
  const {
    params: { isFirstWallet, type },
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
              component={ChooseWalletGroup}
              initialParams={{ isFirstWallet }}
              name={Routes.CHOOSE_WALLET_GROUP}
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
