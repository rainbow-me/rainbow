import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useRoute } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard } from 'react-native';
import { useValue } from 'react-native-redash/src/v1';
import styled from 'styled-components';
import { useMemoOne } from 'use-memo-one';
import { FlexItem } from '../components/layout';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../screens/CurrencySelectModal' was resolv... Remove this comment to see the full error message
import CurrencySelectModal from '../screens/CurrencySelectModal';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../screens/ExpandedAssetSheet' was resolve... Remove this comment to see the full error message
import ExpandedAssetSheet from '../screens/ExpandedAssetSheet';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../screens/SwapModal' was resolved to '/Us... Remove this comment to see the full error message
import SwapModalScreen from '../screens/SwapModal';
// @ts-expect-error ts-migrate(6142) FIXME: Module './Navigation' was resolved to '/Users/nick... Remove this comment to see the full error message
import { useNavigation } from './Navigation';
// @ts-expect-error ts-migrate(6142) FIXME: Module './ScrollPagerWrapper' was resolved to '/Us... Remove this comment to see the full error message
import ScrollPagerWrapper from './ScrollPagerWrapper';
// @ts-expect-error ts-migrate(6142) FIXME: Module './config' was resolved to '/Users/nickbyte... Remove this comment to see the full error message
import { exchangeTabNavigatorConfig, stackNavigationConfig } from './config';
// @ts-expect-error ts-migrate(6142) FIXME: Module './effects' was resolved to '/Users/nickbyt... Remove this comment to see the full error message
import { exchangeModalPreset, expandedPreset } from './effects';
import Routes from './routesNames';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useDimensions } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { position } from '@rainbow-me/styles';

const Stack = createStackNavigator();
const Tabs = createMaterialTopTabNavigator();

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const GestureBlocker = styled.View.attrs({
  pointerEvents: 'none',
})`
  ${position.size('100%')};
  background-color: ${({ theme: { colors } }: any) => colors.transparent};
  position: absolute;
`;

function useStateCallback(initialState: any) {
  const [state, setState] = useState(initialState);
  const cbRef = useRef(null); // mutable ref to store current callback

  const setStateCallback = (state: any, cb: any) => {
    if (cb !== undefined) {
      cbRef.current = cb; // store passed callback to ref
    }
    setState(state);
  };

  useEffect(() => {
    // cb.current is `null` on initial render, so we only execute cb on state *updates*
    if (cbRef.current) {
      // @ts-expect-error ts-migrate(2721) FIXME: Cannot invoke an object which is possibly 'null'.
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
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <Stack.Navigator
        {...stackNavigationConfig}
        initialRouteName={Routes.MAIN_EXCHANGE_SCREEN}
        screenOptions={exchangeModalPreset}
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Stack.Screen
          component={SwapModal}
          initialParams={params}
          name={Routes.MAIN_EXCHANGE_SCREEN}
        />
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
        {android && (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'setNativeProps' does not exist on type '... Remove this comment to see the full error message
      ref.current?.setNativeProps?.({
        pointerEvents: pointerEventsVal ? 'none' : 'auto',
      });
    }, []);

    const handle = useRef();

    const enableInteractionsAfterOpeningKeyboard = useCallback(() => {
      handle.current &&
        // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'undefined' is not assignable to ... Remove this comment to see the full error message
        Keyboard.removeListener('keyboardDidShow', handle.current);
      // @ts-expect-error ts-migrate(2322) FIXME: Type '() => void' is not assignable to type 'undef... Remove this comment to see the full error message
      handle.current = () => {
        // this timeout helps to omit a visual glitch
        setTimeout(() => {
          setSwipeEnabled(true);
          // @ts-expect-error ts-migrate(2322) FIXME: Type 'null' is not assignable to type 'undefined'.
          handle.current = null;
        }, 200);
      };
      // fallback if was already opened
      // @ts-expect-error ts-migrate(2349) FIXME: This expression is not callable.
      setTimeout(() => handle.current?.(), 300);
      // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'undefined' is not assignable to ... Remove this comment to see the full error message
      handle.current && Keyboard.addListener('keyboardDidShow', handle.current);
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
          handle.current &&
            // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'undefined' is not assignable to ... Remove this comment to see the full error message
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
          handle.current &&
            // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'undefined' is not assignable to ... Remove this comment to see the full error message
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
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <ScrollPagerWrapper
          {...props}
          id="exchange"
          onMomentumScrollEnd={onMomentumScrollEnd}
          onSwipeEnd={(...args: any[]) => {
            // @ts-expect-error ts-migrate(2556) FIXME: Expected 2 arguments, but got 0 or more.
            onSwipeEnd(...args);
            props.onSwipeEnd();
          }}
          onSwipeStart={(position: any) => {
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
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <FlexItem>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Tabs.Navigator
          pager={renderPager}
          position={tabTransitionPosition}
          swipeEnabled={swipeEnabled}
          {...exchangeTabNavigatorConfig}
        >
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Tabs.Screen
            component={MainExchangeNavigator}
            initialParams={initialParams}
            name={Routes.MAIN_EXCHANGE_NAVIGATOR}
          />
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Tabs.Screen
            component={CurrencySelectModal}
            initialParams={initialParams}
            name={Routes.CURRENCY_SELECT_SCREEN}
          />
        </Tabs.Navigator>
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
        {ios && <GestureBlocker ref={ref} />}
      </FlexItem>
    );
  };
}

export default ExchangeNavigatorFactory();
