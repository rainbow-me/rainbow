import { View } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { RouteProp, useRoute } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useCallback, useEffect, useRef } from 'react';
import { useMemoOne } from 'use-memo-one';
import { FlexItem } from '../components/layout';
import Routes from '@/navigation/routesNames';
import { cancelNext, uncancelNext } from '../hooks/useMagicAutofocus';
import CurrencySelectModal from '../screens/CurrencySelectModal';
import ExpandedAssetSheet from '../screens/ExpandedAssetSheet';
import SwapModalScreen from '../screens/SwapModal';
import { getActiveRoute, useNavigation } from './Navigation';
import { exchangeTabNavigatorConfig, stackNavigationConfig } from './config';
import {
  exchangeModalPreset,
  expandedPreset,
  swapSettingsPreset,
} from './effects';
import { useSwapCurrencies } from '@/hooks';
import styled from '@/styled-thing';
import { position } from '@/styles';

const Stack = createStackNavigator();
const Tabs = createMaterialTopTabNavigator();

const GestureBlocker = styled(View).attrs({
  pointerEvents: 'none',
})({
  ...position.sizeAsObject('100%'),
  backgroundColor: ({ theme: { colors } }: { theme: { colors: any } }) =>
    colors.transparent,
  position: 'absolute',
});

type ExchangeModalNavigator = {
  [Routes.MAIN_EXCHANGE_NAVIGATOR]: {
    fromDiscover?: boolean;
    params?: {
      toggleGestureEnabled: (dismissable: boolean) => void;
    };
  };
};

export function ExchangeNavigatorFactory(
  SwapModal: React.FC = SwapModalScreen
): React.FC {
  function MainExchangeNavigator(): JSX.Element {
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
        {android && (
          <>
            <Stack.Screen
              component={ExpandedAssetSheet}
              initialParams={params}
              name={Routes.SWAP_DETAILS_SHEET}
              options={expandedPreset}
            />
            <Stack.Screen
              component={ExpandedAssetSheet}
              name={Routes.SWAP_SETTINGS_SHEET}
              options={swapSettingsPreset}
            />
          </>
        )}
      </Stack.Navigator>
    );
  }

  return function ExchangeModalNavigator(): JSX.Element {
    const ref = useRef();
    const { params } = useRoute<
      RouteProp<ExchangeModalNavigator, 'MainExchangeNavigator'>
    >();

    const { setOptions, addListener, removeListener } = useNavigation();

    const { inputCurrency, outputCurrency } = useSwapCurrencies();

    useEffect(() => {
      // Workaround to fix weird keyboard focus issues upon immediate screen focus then unfocus
      if (android && params?.fromDiscover) {
        // TODO: This event doesn't exist?
        // addListener('gestureStart', cancelNext);
        addListener('blur', uncancelNext);
        addListener('focus', uncancelNext);
        return () => {
          // TODO: This event doesn't exist?
          // removeListener('gestureStart', cancelNext);
          removeListener('blur', uncancelNext);
          removeListener('focus', uncancelNext);
        };
      }
    }, [addListener, removeListener, params]);

    const toggleGestureEnabled = useCallback(
      (dismissable: boolean) => {
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

    const enableSwipe =
      routeName === Routes.CURRENCY_SELECT_SCREEN &&
      (!!inputCurrency || !!outputCurrency);

    return (
      <FlexItem>
        <Tabs.Navigator
          screenOptions={{ swipeEnabled: enableSwipe }}
          {...exchangeTabNavigatorConfig}
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
        {ios && <GestureBlocker ref={ref} />}
      </FlexItem>
    );
  };
}
export default ExchangeNavigatorFactory();
