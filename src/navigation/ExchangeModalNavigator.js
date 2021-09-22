import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useRoute } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard } from 'react-native';
import { useValue } from 'react-native-redash/src/v1';
import styled from 'styled-components';
import { useMemoOne } from 'use-memo-one';
import { FlexItem } from '../components/layout';
import CurrencySelectModal from '../screens/CurrencySelectModal';
import ExpandedAssetSheet from '../screens/ExpandedAssetSheet';
import SwapModalScreen from '../screens/SwapModal';
import { useNavigation } from './Navigation';
import ScrollPagerWrapper from './ScrollPagerWrapper';
import { exchangeTabNavigatorConfig, stackNavigationConfig } from './config';
import { exchangeModalPreset, expandedPreset } from './effects';
import Routes from './routesNames';
import { useDimensions } from '@rainbow-me/hooks';
import { position } from '@rainbow-me/styles';

const Stack = createStackNavigator();
const Tabs = createMaterialTopTabNavigator();

const GestureBlocker = styled.View.attrs({
  pointerEvents: 'none',
})`
  ${position.size('100%')};
  background-color: ${({ theme: { colors } }) => colors.transparent};
  position: absolute;
`;

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
        {android && (
          <Stack.Screen
            component={ExpandedAssetSheet}
            initialParams={params}
            name={Routes.SWAP_DETAILS_SHEET}
            options={expandedPreset}
          />
        )}
      </Stack.Navigator>
    );
  }

  return function ExchangeModalNavigator() {
    const { width } = useDimensions();
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
        width,
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
        width,
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
      [
        onMomentumScrollEnd,
        onSwipeEnd,
        setPointerEvents,
        setSwipeEnabled,
        width,
      ]
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
        blockInteractions,
        setPointerEvents,
        tabTransitionPosition,
        toggleGestureEnabled,
      ]
    );

    return (
      <FlexItem>
        <Tabs.Navigator
          pager={renderPager}
          position={tabTransitionPosition}
          swipeEnabled={swipeEnabled}
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
