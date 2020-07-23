import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useIsFocused, useRoute } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import { useCallback, useMemo } from 'use-memo-one';
import CurrencySelectModal from '../screens/CurrencySelectModal';
import ModalScreen from '../screens/ModalScreen';
import SwapModal from '../screens/SwapModal';
import { useNavigation } from './Navigation';
import { exchangeTabNavigatorConfig, stackNavigationConfig } from './config';
import { exchangeModalPreset, swapDetailsPreset } from './effects';
import { useReanimatedValue } from './helpers';
import Routes from './routesNames';

const Tabs = createMaterialTopTabNavigator();
const Stack = createStackNavigator();

function MainExchangeNavigator() {
  const isFocused = useIsFocused();
  const {
    params: { position },
  } = useRoute();

  useEffect(() => {
    if (isFocused) {
      position.setValue(0);
    }
  }, [isFocused, position]);

  return (
    <Stack.Navigator
      {...stackNavigationConfig}
      initialRouteName={Routes.MAIN_EXCHANGE_SCREEN}
      screenOptions={exchangeModalPreset}
    >
      <Stack.Screen
        component={SwapModal}
        initialParams={{
          position,
        }}
        name={Routes.MAIN_EXCHANGE_SCREEN}
      />
      <Stack.Screen
        component={ModalScreen}
        name={Routes.SWAP_DETAILS_SCREEN}
        options={swapDetailsPreset}
      />
    </Stack.Navigator>
  );
}

function ExchangeModalNavigator() {
  const { setOptions } = useNavigation();
  const position = useReanimatedValue(0);
  const [swipeEnabled, setSwipeEnabled] = useState(false);
  const config = useMemo(() => exchangeTabNavigatorConfig(position), [
    position,
  ]);
  const toggleGestureEnabled = useCallback(
    dismissable => {
      setSwipeEnabled(!dismissable);
      setOptions({ dismissable });
    },
    [setOptions]
  );
  return (
    <Tabs.Navigator {...config} swipeEnabled={swipeEnabled}>
      <Tabs.Screen
        component={MainExchangeNavigator}
        initialParams={{
          position,
        }}
        name={Routes.MAIN_EXCHANGE_NAVIGATOR}
      />
      <Tabs.Screen
        component={CurrencySelectModal}
        initialParams={{
          position,
          toggleGestureEnabled,
        }}
        name={Routes.CURRENCY_SELECT_SCREEN}
      />
    </Tabs.Navigator>
  );
}

export default ExchangeModalNavigator;
