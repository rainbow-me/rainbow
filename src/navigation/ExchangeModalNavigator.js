import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useRoute } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard } from 'react-native';
import { useValue } from 'react-native-redash';
import { useMemoOne } from 'use-memo-one';
import CurrencySelectModal from '../screens/CurrencySelectModal';
import ModalScreen from '../screens/ModalScreen';
import SwapModalScreen from '../screens/SwapModal';
import { deviceUtils } from '../utils';
import { useNavigation } from './Navigation';
import { exchangeTabNavigatorConfig, stackNavigationConfig } from './config';
import { exchangeModalPreset, swapDetailsPreset } from './effects';
import { ScrollPagerWrapper } from './helpers';
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
          name={Routes.SWAP_DETAILS_SCREEN}
          options={swapDetailsPreset}
        />
      </Stack.Navigator>
    );
  }

  return function ExchangeModalNavigator() {
    const { setOptions } = useNavigation();
    const pointerEvents = useRef('auto');
    const spw = useRef();
    const isTransitionHappening = useRef(false);

    const tabTransitionPosition = useValue(0);

    const [swipeEnabled, setSwipeEnabledCallback] = useStateCallback(true);

    const setPointerEvents = useCallback(pointerEventsVal => {
      pointerEvents.current = pointerEventsVal;
      spw.current?.scrollViewRef.current
        .getNode()
        .getNativeScrollRef()
        .setNativeProps({
          pointerEvents: pointerEventsVal,
        });
    }, []);

    const handle = useRef();

    const enableInteractionsAfterOpeningKeyboard = useCallback(() => {
      Keyboard.removeListener('keyboardDidShow', handle.current);
      handle.current = () => {
        // this timeout helps to omit a visual glitch
        setTimeout(() => {
          setSwipeEnabledCallback(true);
          handle.current = null;
        }, 200);
        Keyboard.removeListener('keyboardDidShow', handle.current);
      };
      // fallback if was already opened
      setTimeout(() => handle.current?.(), 300);
      Keyboard.addListener('keyboardDidShow', handle.current);
    }, [setSwipeEnabledCallback]);

    const blockInteractions = useCallback(() => {
      setSwipeEnabledCallback(false);
    }, [setSwipeEnabledCallback]);

    const onMomentumScrollEnd = useCallback(
      position => {
        if (position === width || position === 0) {
          // this event can be called a moment before
          setTimeout(() => setPointerEvents('auto'), 100);
          isTransitionHappening.current = false;
        }
        if (position === width) {
          enableInteractionsAfterOpeningKeyboard();
        } else if (position === 0) {
          Keyboard.removeListener('keyboardDidShow', handle.current);
        }
      },
      [enableInteractionsAfterOpeningKeyboard, setPointerEvents]
    );

    const onSwipeEnd = useCallback(
      (position, targetContentOffset) => {
        if (position !== width && position !== 0) {
          setPointerEvents('none');
        }

        if (position === 0 || position === width) {
          isTransitionHappening.current = false;
        }

        if (position === width) {
          setPointerEvents('auto');
          enableInteractionsAfterOpeningKeyboard();
        }
        if (targetContentOffset === 0) {
          Keyboard.removeListener('keyboardDidShow', handle.current);
          setSwipeEnabledCallback(false, () => setPointerEvents('auto'));
        }
      },
      [
        enableInteractionsAfterOpeningKeyboard,
        setPointerEvents,
        setSwipeEnabledCallback,
      ]
    );

    const renderPager = useCallback(
      props => (
        <ScrollPagerWrapper
          {...props}
          onMomentumScrollEnd={onMomentumScrollEnd}
          onSwipeEnd={(...args) => {
            onSwipeEnd(...args);
            props.onSwipeEnd();
          }}
          onSwipeStart={position => {
            if (position === width) {
              setPointerEvents('none');
            }
            isTransitionHappening.current = true;
            props.onSwipeStart();
          }}
          ref={spw}
          setSwipeEnabled={setSwipeEnabledCallback}
        />
      ),
      [onMomentumScrollEnd, onSwipeEnd, setSwipeEnabledCallback]
    );

    const toggleGestureEnabled = useCallback(
      dismissable => {
        setOptions({ dismissable });
      },
      [setOptions]
    );

    const initialParams = useMemoOne(
      () => ({
        blockInteractions,
        isTransitionHappening,
        tabTransitionPosition,
        toggleGestureEnabled,
      }),
      [
        isTransitionHappening,
        tabTransitionPosition,
        toggleGestureEnabled,
        blockInteractions,
      ]
    );

    return (
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
    );
  };
}

export default ExchangeNavigatorFactory();
