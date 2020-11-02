import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useRoute } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useCallback } from 'react';
import { View } from 'react-native';
import { useMemoOne } from 'use-memo-one';
import CurrencySelectModal from '../screens/CurrencySelectModal';
import ModalScreen from '../screens/ModalScreen';
import SwapModalScreen from '../screens/SwapModal';
import ScrollPagerWrapper from './ScrollPagerWrapper';
import {
  ExchangeContext,
  exchangeTabNavigatorConfig,
  stackNavigationConfig,
} from './config';
import { exchangeModalPreset, swapDetailsPreset } from './effects';
import Routes from './routesNames';
import useOptionsForScrollPager from './useOptionsForScrollPager';

const Stack = createStackNavigator();
const Tabs = createMaterialTopTabNavigator();

export function ExchangeNavigatorFactory(SwapModal = SwapModalScreen) {
  function MainExchangeNavigator() {
    const { params } = useRoute();

    return (
      <Stack.Navigator
        {...stackNavigationConfig}
        initialRouteName={Routes.MAIN_EXCHANGE_SCREEN}
        screenOptions={exchangeModalPreset}
      >
        <Stack.Screen
          component={SwapModal}
          initialParams={params}
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

  return function ExchangeModalNavigator() {
    const {
      tabTransitionPosition,
      swipeEnabled,
      toggleGestureEnabled,
      onSwipeStart,
      onMomentumScrollEnd,
      onSwipeEnd,
      setPointerEvents,
      ref,
      contextValue,
    } = useOptionsForScrollPager();

    const renderPager = useCallback(
      props => (
        <ScrollPagerWrapper
          {...props}
          onMomentumScrollEnd={onMomentumScrollEnd}
          onSwipeEnd={(position, targetContentOffset) => {
            onSwipeEnd(position, targetContentOffset);
            props.onSwipeEnd();
          }}
          onSwipeStart={position => {
            onSwipeStart(position);
            props.onSwipeStart();
          }}
        />
      ),
      [onMomentumScrollEnd, onSwipeEnd, onSwipeStart]
    );

    const initialParams = useMemoOne(
      () => ({
        setPointerEvents,
        tabTransitionPosition,
        toggleGestureEnabled,
      }),
      [tabTransitionPosition, toggleGestureEnabled, setPointerEvents]
    );

    return (
      <ExchangeContext.Provider value={contextValue}>
        <View style={{ flex: 1 }}>
          <Tabs.Navigator
            swipeEnabled={swipeEnabled}
            {...exchangeTabNavigatorConfig}
            pager={renderPager}
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
          <View
            pointerEvents="none"
            ref={ref}
            style={{
              backgroundColor: 'transparent',
              height: '100%',
              position: 'absolute',
              width: '100%',
            }}
          />
        </View>
      </ExchangeContext.Provider>
    );
  };
}

export default ExchangeNavigatorFactory();
