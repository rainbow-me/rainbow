import { createMaterialTopTabNavigator as newCreateMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { createStackNavigator as newCreateStackNavigator } from '@react-navigation/stack';

import React from 'react';
import { useCallback } from 'use-memo-one';
import { withBlockedHorizontalSwipe } from '../hoc';
import CurrencySelectModal from '../screens/CurrencySelectModal';
import ModalScreen from '../screens/ModalScreen';
import SwapModal from '../screens/SwapModal';
import { useNavigation } from './Navigation';
import {
  ExchangeModalTabPosition,
  exchangeTabNavigatorConfig,
  stackNavigationConfig,
} from './config';
import { exchangeModalPreset } from './effects';
import Routes from './routesNames';

const Tabs = newCreateMaterialTopTabNavigator();

function SwapDetailsScreen(props) {
  const Component = withBlockedHorizontalSwipe(ModalScreen);
  return <Component {...props} />;
}

const NewStack = newCreateStackNavigator();

function MainExchangeNavigator() {
  return (
    <NewStack.Navigator
      {...stackNavigationConfig}
      screenOptions={exchangeModalPreset}
      initialRouteName={Routes.MAIN_EXCHANGE_SCREEN}
    >
      <NewStack.Screen
        name={Routes.MAIN_EXCHANGE_SCREEN}
        component={SwapModal}
      />
      <NewStack.Screen
        name={Routes.SWAP_DETAILS_SCREEN}
        component={SwapDetailsScreen}
      />
    </NewStack.Navigator>
  );
}

function NewExchangeModalNavigator() {
  const { setOptions } = useNavigation();
  const toggleGestureEnabled = useCallback(
    gestureEnabled => setOptions({ gestureEnabled }),
    [setOptions]
  );
  return (
    <Tabs.Navigator {...exchangeTabNavigatorConfig}>
      <Tabs.Screen
        name={Routes.MAIN_EXCHANGE_NAVIGATOR}
        component={MainExchangeNavigator}
        initialParams={{
          position: ExchangeModalTabPosition,
        }}
      />
      <Tabs.Screen
        name={Routes.CURRENCY_SELECT_SCREEN}
        component={CurrencySelectModal}
        initialParams={{
          position: ExchangeModalTabPosition,
          toggleGestureEnabled,
        }}
      />
    </Tabs.Navigator>
  );
}

export default NewExchangeModalNavigator;
