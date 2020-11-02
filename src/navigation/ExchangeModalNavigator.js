import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useRoute } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Keyboard, View } from 'react-native';
import { useValue } from 'react-native-redash';
import { useMemoOne } from 'use-memo-one';
import CurrencySelectModal from '../screens/CurrencySelectModal';
import ModalScreen from '../screens/ModalScreen';
import SwapModalScreen from '../screens/SwapModal';
import { deviceUtils } from '../utils';
import { useNavigation } from './Navigation';
import ScrollPagerWrapper from './ScrollPagerWrapper';
import {
  ExchangeContext,
  exchangeTabNavigatorConfig,
  stackNavigationConfig,
} from './config';
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
    const startPosition = useRef(-1);
    const [willBeOnSwapSelection, setWillBeOnSwapSelection] = useState(false);
    const tabTransitionPosition = useValue(0);
    const [swipeEnabled, setSwipeEnabled] = useStateCallback(false);

    const setPointerEvents = useCallback(pointerEventsVal => {
      pointerEvents.current = pointerEventsVal;
      ref.current.setNativeProps({
        pointerEvents: pointerEventsVal ? 'none' : 'auto',
      });
    }, []);

    const performImperativeAction = useCallback(
      action => {
        setPointerEvents(false);
        Keyboard.dismiss();
        action();
        const listener = () => {
          setPointerEvents(true);
          Keyboard.removeListener('keyboardDidShow', listener);
        };
        Keyboard.addListener('keyboardDidShow', listener);
      },
      [setPointerEvents]
    );

    const value = useMemo(
      () => ({
        performImperativeAction,
        startedTransition: willBeOnSwapSelection,
      }),
      [performImperativeAction, willBeOnSwapSelection]
    );

    const blockInteractions = useCallback(() => {
      setSwipeEnabled(false);
    }, [setSwipeEnabled]);

    const onMomentumScrollEnd = useCallback(
      position => {
        if (position === width) {
          if (startPosition.current === width) {
            setPointerEvents(true);
          }
          setSwipeEnabled(true);
        } else if (position === 0) {
          setSwipeEnabled(false);
          setPointerEvents(true);
        }
        startPosition.current = -1;
      },
      [setPointerEvents, setSwipeEnabled]
    );

    const onSwipeEnd = useCallback(
      (position, targetContentOffset) => {
        if (position !== width && position !== 0) {
          setPointerEvents(false);
        }

        if (position === width && startPosition.current === width) {
          setPointerEvents(true);
        }

        if (position === 0) {
          setSwipeEnabled(false);
          setPointerEvents(true);
        }
        if (position === targetContentOffset) {
          startPosition.current = -1;
        }

        if (targetContentOffset === 0) {
          setWillBeOnSwapSelection(true);
        }
      },
      [setSwipeEnabled, setPointerEvents]
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
            startPosition.current = position;
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
        setOptions({ dismissable });
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
      <ExchangeContext.Provider value={value}>
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
