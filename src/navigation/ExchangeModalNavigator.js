import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useCallback } from 'react';
import { useValue } from 'react-native-redash';
import { useMemoOne } from 'use-memo-one';
import { withBlockedHorizontalSwipe } from '../hoc';
import CurrencySelectModal from '../screens/CurrencySelectModal';
import ModalScreen from '../screens/ModalScreen';
import SwapModal from '../screens/SwapModal';
import { useNavigation } from './Navigation';
import { exchangeTabNavigatorConfig, stackNavigationConfig } from './config';
import { exchangeModalPreset, swapDetailsPreset } from './effects';
import Routes from './routesNames';

const Tabs = createMaterialTopTabNavigator();
const Stack = createStackNavigator();

function SwapDetailsScreen(props) {
  const Component = withBlockedHorizontalSwipe(ModalScreen);
  return <Component {...props} />;
}

function MainExchangeNavigator() {
  const {
    params: { tabTransitionPosition },
  } = useRoute();

  useFocusEffect(
    useCallback(() => {
      tabTransitionPosition.setValue(0);
    }, [tabTransitionPosition])
  );

  return (
    <Stack.Navigator
      {...stackNavigationConfig}
      initialRouteName={Routes.MAIN_EXCHANGE_SCREEN}
      screenOptions={exchangeModalPreset}
    >
      <Stack.Screen
        component={SwapModal}
        initialParams={{
          tabTransitionPosition,
        }}
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

export default function ExchangeModalNavigator() {
  const { setOptions } = useNavigation();
  const tabTransitionPosition = useValue(0);

  const config = useMemoOne(
    () => exchangeTabNavigatorConfig(tabTransitionPosition),
    [tabTransitionPosition]
  );

  const toggleGestureEnabled = useCallback(
    gestureEnabled => setOptions({ gestureEnabled }),
    [setOptions]
  );

  return (
    <Tabs.Navigator {...config}>
      <Tabs.Screen
        component={MainExchangeNavigator}
        initialParams={{
          tabTransitionPosition,
        }}
        name={Routes.MAIN_EXCHANGE_NAVIGATOR}
      />
      <Tabs.Screen
        component={CurrencySelectModal}
        initialParams={{
          tabTransitionPosition,
          toggleGestureEnabled,
        }}
        name={Routes.CURRENCY_SELECT_SCREEN}
      />
    </Tabs.Navigator>
  );
}
