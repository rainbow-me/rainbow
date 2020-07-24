import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useRoute } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useCallback } from 'react';
import { useValue } from 'react-native-redash';
import { useMemoOne } from 'use-memo-one';
import HorizontalGestureBlocker from '../components/HorizontalGestureBlocker';
import CurrencySelectModal from '../screens/CurrencySelectModal';
import ModalScreen from '../screens/ModalScreen';
import SwapModalScreen from '../screens/SwapModal';
import { useNavigation } from './Navigation';
import { exchangeTabNavigatorConfig, stackNavigationConfig } from './config';
import { exchangeModalPreset, swapDetailsPreset } from './effects';
import Routes from './routesNames';

const Stack = createStackNavigator();
const Tabs = createMaterialTopTabNavigator();

function SwapDetailsScreen(props) {
  return (
    <HorizontalGestureBlocker>
      <ModalScreen {...props} />
    </HorizontalGestureBlocker>
  );
}

export function ExchangeNavigatorFactory(SwapModal = SwapModalScreen) {
  function MainExchangeNavigator() {
    const route = useRoute();
    const tabTransitionPosition = route?.params?.tabTransitionPosition || 0;

    return (
      <Stack.Navigator
        {...stackNavigationConfig}
        initialRouteName={Routes.MAIN_EXCHANGE_SCREEN}
        screenOptions={exchangeModalPreset}
      >
        <Stack.Screen
          component={SwapModal}
          initialParams={{ tabTransitionPosition }}
          name={Routes.MAIN_EXCHANGE_SCREEN}
        />
        <Stack.Screen
          component={SwapDetailsScreen}
          name={Routes.SWAP_DETAILS_SCREEN}
          options={swapDetailsPreset}
        />
      </Stack.Navigator>
    );
  }

  return function ExchangeModalNavigator() {
    const { setOptions } = useNavigation();

    const tabTransitionPosition = useValue(0);

    const toggleGestureEnabled = useCallback(
      gestureEnabled => setOptions({ gestureEnabled }),
      [setOptions]
    );

    const initialParams = useMemoOne(
      () => ({
        tabTransitionPosition,
        toggleGestureEnabled,
      }),
      [tabTransitionPosition, toggleGestureEnabled]
    );

    return (
      <Tabs.Navigator
        {...exchangeTabNavigatorConfig}
        position={tabTransitionPosition}
      >
        <Tabs.Screen
          component={MainExchangeNavigator}
          initialParams={initialParams}
          name={Routes.MAIN_EXCHANGE_NAVIGATOR}
        />
        <Tabs.Screen
          component={CurrencySelectModal}
          initialParams={initialParams}
          name={Routes.CURRENCY_SELECT_SCREEN}
        />
      </Tabs.Navigator>
    );
  };
}

export default ExchangeNavigatorFactory();
