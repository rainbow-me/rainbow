import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useRoute } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useCallback, useEffect, useRef } from 'react';
import { useMemoOne } from 'use-memo-one';
import { FlexItem } from '../components/layout';
import { cancelNext, uncancelNext } from '../hooks/useMagicAutofocus';
import CurrencySelectModal from '../screens/CurrencySelectModal';
import ExpandedAssetSheet from '../screens/ExpandedAssetSheet';
import SwapModalScreen from '../screens/SwapModal';
import { getActiveRoute, useNavigation } from './Navigation';
import { exchangeTabNavigatorConfig, stackNavigationConfig } from './config';
import { exchangeModalPreset, expandedPreset, swapSettingsPreset } from './effects';
import Routes from './routesNames';
import { useSwapCurrencies } from '@/hooks';
import styled from '@/styled-thing';
import { position } from '@/styles';

const Stack = createStackNavigator();
const Tabs = createMaterialTopTabNavigator();

const GestureBlocker = styled.View.attrs({
  pointerEvents: 'none',
})({
  ...position.sizeAsObject('100%'),
  backgroundColor: ({ theme: { colors } }) => colors.transparent,
  position: 'absolute',
});

export function ExchangeNavigatorFactory(SwapModal = SwapModalScreen) {
  function MainExchangeNavigator() {
    const { params } = useRoute();

    return (
      <Stack.Navigator {...stackNavigationConfig} initialRouteName={Routes.MAIN_EXCHANGE_SCREEN} screenOptions={exchangeModalPreset}>
        <Stack.Screen component={SwapModal} initialParams={params} name={Routes.MAIN_EXCHANGE_SCREEN} />
        {android && (
          <>
            <Stack.Screen component={ExpandedAssetSheet} initialParams={params} name={Routes.SWAP_DETAILS_SHEET} options={expandedPreset} />
            <Stack.Screen component={ExpandedAssetSheet} name={Routes.SWAP_SETTINGS_SHEET} options={swapSettingsPreset} />
          </>
        )}
      </Stack.Navigator>
    );
  }

  return function ExchangeModalNavigator() {
    const ref = useRef();
    const { params } = useRoute();
    const { setOptions, addListener, removeListener } = useNavigation();

    const { inputCurrency, outputCurrency } = useSwapCurrencies();

    useEffect(() => {
      // Workaround to fix weird keyboard focus issues upon immediate screen focus then unfocus
      if (android && params.fromDiscover) {
        addListener('gestureStart', cancelNext);
        addListener('blur', uncancelNext);
        addListener('focus', uncancelNext);
        return () => {
          removeListener('gestureStart', cancelNext);
          removeListener('blur', uncancelNext);
          removeListener('focus', uncancelNext);
        };
      }
    }, [addListener, removeListener, params]);

    const toggleGestureEnabled = useCallback(
      dismissable => {
        setOptions({ dismissable, gestureEnabled: dismissable });
      },
      [setOptions]
    );

    const initialParams = useMemoOne(
      () => ({
        toggleGestureEnabled,
        ...params?.params,
      }),
      [toggleGestureEnabled]
    );

    const routeName = getActiveRoute()?.name;

    const enableSwipe = routeName === Routes.CURRENCY_SELECT_SCREEN && (!!inputCurrency || !!outputCurrency);

    return (
      <FlexItem>
        <Tabs.Navigator screenOptions={{ swipeEnabled: enableSwipe }} {...exchangeTabNavigatorConfig}>
          <Tabs.Screen component={MainExchangeNavigator} initialParams={initialParams} name={Routes.MAIN_EXCHANGE_NAVIGATOR} />
          <Tabs.Screen component={CurrencySelectModal} initialParams={initialParams} name={Routes.CURRENCY_SELECT_SCREEN} />
        </Tabs.Navigator>
        {ios && <GestureBlocker ref={ref} />}
      </FlexItem>
    );
  };
}
export default ExchangeNavigatorFactory();
