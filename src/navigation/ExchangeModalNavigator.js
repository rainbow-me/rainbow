import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useRoute } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, View } from 'react-native';
import { useValue } from 'react-native-redash';
import { useMemoOne } from 'use-memo-one';
import CurrencySelectModal from '../screens/CurrencySelectModal';
import ModalScreen from '../screens/ModalScreen';
import SwapModalScreen from '../screens/SwapModal';
import { deviceUtils } from '../utils';
import { useNavigation } from './Navigation';
import ScrollPagerWrapper from './ScrollPagerWrapper';
import { exchangeTabNavigatorConfig, stackNavigationConfig } from './config';
import { exchangeModalPreset, swapDetailsPreset } from './effects';
import Routes from './routesNames';

const { width } = deviceUtils.dimensions;

const Stack = createStackNavigator();
const Tabs = createMaterialTopTabNavigator();

function useStateCallback(initialState) {
  const [state, setState] = useState(initialState);
  const cbRef = useRef(null); // mutable ref to store current callback

  const setStateCallback = (state, cb) => {
    if (cb !== undefined) {
      cbRef.current = cb; // store passed callback to ref
    }
    setState(state);
  };

  useEffect(() => {
    // cb.current is `null` on initial render, so we only execute cb on state *updates*
    if (cbRef.current) {
      cbRef.current(state);
      cbRef.current = null; // reset callback after execution
    }
  }, [state]);

  return [state, setStateCallback];
}

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
          initialParams={params}
          name={Routes.SWAP_DETAILS_SCREEN}
          options={swapDetailsPreset}
        />
      </Stack.Navigator>
    );
  }

  return function ExchangeModalNavigator() {
    const { setOptions } = useNavigation();
    const pointerEvents = useRef('auto');
    const ref = useRef();

    const tabTransitionPosition = useValue(0);

    const [swipeEnabled, setSwipeEnabled] = useStateCallback(false);

    const setPointerEvents = useCallback(pointerEventsVal => {
      pointerEvents.current = pointerEventsVal;
      ref.current?.setNativeProps?.({
        pointerEvents: pointerEventsVal ? 'none' : 'auto',
      });
    }, []);

    const handle = useRef();

    const enableInteractionsAfterOpeningKeyboard = useCallback(() => {
      Keyboard.removeListener('keyboardDidShow', handle.current);
      handle.current = () => {
        // this timeout helps to omit a visual glitch
        setTimeout(() => {
          setSwipeEnabled(true);
          handle.current = null;
        }, 200);
        Keyboard.removeListener('keyboardDidShow', handle.current);
      };
      // fallback if was already opened
      setTimeout(() => handle.current?.(), 300);
      Keyboard.addListener('keyboardDidShow', handle.current);
    }, [setSwipeEnabled]);

    const blockInteractions = useCallback(() => {
      setSwipeEnabled(false);
    }, [setSwipeEnabled]);

    const onMomentumScrollEnd = useCallback(
      position => {
        if (position === width) {
          setPointerEvents(true);
          enableInteractionsAfterOpeningKeyboard();
        } else if (position === 0) {
          setSwipeEnabled(false, () => setPointerEvents(true));
          Keyboard.removeListener('keyboardDidShow', handle.current);
        }
      },
      [
        enableInteractionsAfterOpeningKeyboard,
        setPointerEvents,
        setSwipeEnabled,
      ]
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
          setSwipeEnabled(false, () => setPointerEvents(true));
        }

        if (targetContentOffset === 0) {
          Keyboard.removeListener('keyboardDidShow', handle.current);
          setSwipeEnabled(false, () => setPointerEvents(true));
        }
      },
      [
        enableInteractionsAfterOpeningKeyboard,
        setPointerEvents,
        setSwipeEnabled,
      ]
    );

    const renderPager = useCallback(
      props => (
        <ScrollPagerWrapper
          {...props}
          id="exchange"
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
          setSwipeEnabled={setSwipeEnabled}
        />
      ),
      [onMomentumScrollEnd, onSwipeEnd, setPointerEvents, setSwipeEnabled]
    );

    const toggleGestureEnabled = useCallback(
      dismissable => {
        setOptions({ dismissable, gestureEnabled: dismissable });
      },
      [setOptions]
    );

    const initialParams = useMemoOne(
      () => ({
        blockInteractions,
        setPointerEvents,
        tabTransitionPosition,
        toggleGestureEnabled,
      }),
      [
        tabTransitionPosition,
        toggleGestureEnabled,
        setPointerEvents,
        blockInteractions,
      ]
    );

    return (
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
        {ios && (
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
        )}
      </View>
    );
  };
}

export default ExchangeNavigatorFactory();
