import { createMaterialTopTabNavigator as newCreateMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { createStackNavigator as newCreateStackNavigator } from '@react-navigation/stack';

import React from 'react';
import { useCallback, useMemo } from 'use-memo-one';
import { withBlockedHorizontalSwipe } from '../hoc';
import CurrencySelectModal from '../screens/CurrencySelectModal';
import ModalScreen from '../screens/ModalScreen';
import SwapModal from '../screens/SwapModal';
import { useNavigation } from './Navigation';
import { exchangeTabNavigatorConfig, stackNavigationConfig } from './config';
import { exchangeModalPreset, swapDetailsPreset } from './effects';
import { useReanimatedValue } from './helpers';
import Routes from './routesNames';

const Tabs = newCreateMaterialTopTabNavigator();
const Stack = newCreateStackNavigator();

function SwapDetailsScreen(props) {
  const Component = withBlockedHorizontalSwipe(ModalScreen);
  return <Component {...props} />;
}

function MainExchangeNavigator() {
  return (
    <Stack.Navigator
      {...stackNavigationConfig}
      screenOptions={exchangeModalPreset}
      initialRouteName={Routes.MAIN_EXCHANGE_SCREEN}
    >
      <Stack.Screen name={Routes.MAIN_EXCHANGE_SCREEN} component={SwapModal} />
      <Stack.Screen
        name={Routes.SWAP_DETAILS_SCREEN}
        component={SwapDetailsScreen}
        options={swapDetailsPreset}
      />
    </Stack.Navigator>
  );
}

function NewExchangeModalNavigator() {
  const { setOptions } = useNavigation();
  const position = useReanimatedValue(0);
  const config = useMemo(() => exchangeTabNavigatorConfig(position), [
    position,
  ]);
  const toggleGestureEnabled = useCallback(
    gestureEnabled => setOptions({ gestureEnabled }),
    [setOptions]
  );
  return (
    <Tabs.Navigator {...config}>
      <Tabs.Screen
        name={Routes.MAIN_EXCHANGE_NAVIGATOR}
        component={MainExchangeNavigator}
        initialParams={{
          position,
        }}
      />
      <Tabs.Screen
        name={Routes.CURRENCY_SELECT_SCREEN}
        component={CurrencySelectModal}
        initialParams={{
          position,
          toggleGestureEnabled,
        }}
      />
    </Tabs.Navigator>
  );
}

export default NewExchangeModalNavigator;
