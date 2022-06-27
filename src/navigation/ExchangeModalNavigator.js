import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useRoute } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useCallback, useEffect, useRef } from 'react';
import { Keyboard } from 'react-native';
import { useValue } from 'react-native-redash/src/v1';
import { useMemoOne } from 'use-memo-one';
import { FlexItem } from '../components/layout';
import { cancelNext, uncancelNext } from '../hooks/useMagicAutofocus';
import CurrencySelectModal from '../screens/CurrencySelectModal';
import ExpandedAssetSheet from '../screens/ExpandedAssetSheet';
import SwapModalScreen from '../screens/SwapModal';
import { useNavigation } from './Navigation';
import ScrollPagerWrapper from './ScrollPagerWrapper';
import { exchangeTabNavigatorConfig, stackNavigationConfig } from './config';
import {
  exchangeModalPreset,
  expandedPreset,
  swapSettingsPreset,
} from './effects';
import Routes from './routesNames';
import { useDimensions } from '@rainbow-me/hooks';
import styled from '@rainbow-me/styled-components';
import { position } from '@rainbow-me/styles';

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

  return function ExchangeModalNavigator() {
    const { width } = useDimensions();
    const { setOptions, addListener, removeListener } = useNavigation();
    const pointerEvents = useRef('auto');
    const ref = useRef();
    const { params } = useRoute();

    const tabTransitionPosition = useValue(0);

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

    const setPointerEvents = useCallback(pointerEventsVal => {
      pointerEvents.current = pointerEventsVal;
      ref.current?.setNativeProps?.({
        pointerEvents: pointerEventsVal ? 'none' : 'auto',
      });
    }, []);

    const handle = useRef();

    const enableInteractionsAfterOpeningKeyboard = useCallback(() => {
      handle.current &&
        Keyboard.removeListener('keyboardDidShow', handle.current);
      handle.current = () => {
        // this timeout helps to omit a visual glitch
        setTimeout(() => {
          handle.current = null;
        }, 200);
      };
      // fallback if was already opened
      setTimeout(() => handle.current?.(), 300);
      handle.current && Keyboard.addListener('keyboardDidShow', handle.current);
    }, []);

    const onMomentumScrollEnd = useCallback(
      position => {
        if (position === width) {
          setPointerEvents(true);
          enableInteractionsAfterOpeningKeyboard();
        } else if (position === 0) {
          setPointerEvents(true);
          handle.current &&
            Keyboard.removeListener('keyboardDidShow', handle.current);
        }
      },
      [enableInteractionsAfterOpeningKeyboard, setPointerEvents, width]
    );

    const onSwipeEnd = useCallback(
      (position, targetContentOffset) => {
        if (position !== width && position !== 0) {
          setPointerEvents(false);
        }

        if (position === width) {
          setPointerEvents(true);
          enableInteractionsAfterOpeningKeyboard();
        }

        if (position === 0) {
          setPointerEvents(true);
        }

        if (targetContentOffset === 0) {
          handle.current &&
            Keyboard.removeListener('keyboardDidShow', handle.current);
          setPointerEvents(true);
        }
      },
      [enableInteractionsAfterOpeningKeyboard, setPointerEvents, width]
    );

    const renderPager = useCallback(
      props => (
        <ScrollPagerWrapper
          {...props}
          id="exchange"
          initialScrollPosition={props.navigationState.index}
          onMomentumScrollEnd={onMomentumScrollEnd}
          onSwipeEnd={(...args) => {
            onSwipeEnd(...args);
            props.onSwipeEnd();
          }}
          onSwipeStart={position => {
            if (position === width) {
              setPointerEvents(false);
            }
            props.onSwipeStart();
          }}
        />
      ),
      [onMomentumScrollEnd, onSwipeEnd, setPointerEvents, width]
    );

    const toggleGestureEnabled = useCallback(
      dismissable => {
        setOptions({ dismissable, gestureEnabled: dismissable });
      },
      [setOptions]
    );

    const initialParams = useMemoOne(
      () => ({
        setPointerEvents,
        tabTransitionPosition,
        toggleGestureEnabled,
        ...params?.params,
      }),
      [setPointerEvents, tabTransitionPosition, toggleGestureEnabled]
    );

    return (
      <FlexItem>
        <Tabs.Navigator
          pager={renderPager}
          position={tabTransitionPosition}
          swipeEnabled={false}
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
