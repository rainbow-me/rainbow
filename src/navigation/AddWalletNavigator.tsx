import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import React from 'react';
import Routes from '@/navigation/routesNames';
import { deviceUtils } from '@/utils';
import { AddWalletSheet } from '@/screens/AddWalletSheet';
import { ImportSeedPhraseSheet } from '@/screens/ImportSeedPhraseSheet';

const Swipe = createMaterialTopTabNavigator();

export const AddWalletNavigator = () => (
  <Swipe.Navigator
    initialLayout={deviceUtils.dimensions}
    initialRouteName={Routes.ADD_WALLET_SHEET}
    swipeEnabled={false}
    tabBar={() => null}
  >
    <Swipe.Screen component={AddWalletSheet} name={Routes.ADD_WALLET_SHEET} />
    <Swipe.Screen
      component={ImportSeedPhraseSheet}
      name={Routes.IMPORT_SEED_PHRASE_FLOW}
    />
  </Swipe.Navigator>
);
