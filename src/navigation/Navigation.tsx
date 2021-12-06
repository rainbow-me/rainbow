import {
  CommonActions,
  useNavigation as oldUseNavigation,
  StackActions,
  useIsFocused,
} from '@react-navigation/native';
import { get } from 'lodash';
import React from 'react';
import { Value } from 'react-native-reanimated';
import { useCallbackOne } from 'use-memo-one';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import { NATIVE_ROUTES } from '@rainbow-me/routes';

let TopLevelNavigationRef: any = null;
const transitionPosition = new Value(0);

const poppingCounter = { isClosing: false, pendingActions: [] };

export function addActionAfterClosingSheet(action: any) {
  if (poppingCounter.isClosing) {
    // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'any' is not assignable to parame... Remove this comment to see the full error message
    poppingCounter.pendingActions.push(action);
  } else {
    action();
  }
}

export function onWillPop() {
  poppingCounter.isClosing = true;
}

export function onDidPop() {
  poppingCounter.isClosing = false;
  if (poppingCounter.pendingActions.length !== 0) {
    setImmediate(() => {
      // @ts-expect-error ts-migrate(2349) FIXME: This expression is not callable.
      poppingCounter.pendingActions.forEach(action => action());
      poppingCounter.pendingActions = [];
    });
  }
}

export function useNavigation() {
  const { navigate: oldNavigate, ...rest } = oldUseNavigation();

  const handleNavigate = useCallbackOne(
    (...args) => navigate(oldNavigate, ...args),
    [oldNavigate]
  );

  return {
    navigate: handleNavigate,
    ...rest,
  };
}

export function withNavigation(Component: any) {
  return function WithNavigationWrapper(props: any) {
    const navigation = useNavigation();
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    return <Component {...props} navigation={navigation} />;
  };
}

export function withNavigationFocus(Component: any) {
  return function WithNavigationWrapper(props: any) {
    const isFocused = useIsFocused();

    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    return <Component {...props} isFocused={isFocused} />;
  };
}

let blocked = false;
let timeout: any = null;
function block() {
  blocked = true;
  if (timeout !== null) {
    clearTimeout(timeout);
    timeout = null;
  }
  setTimeout(() => (blocked = false), 200);
}

/**
 * With this wrapper we allow to delay pushing of native
 * screen with delay when there's a closing transaction in progress
 * Also, we take care to hide discover sheet if needed
 */
export function navigate(oldNavigate: any, ...args: any[]) {
  if (typeof args[0] === 'string') {
    if (NATIVE_ROUTES.indexOf(args[0]) !== -1) {
      let wasBlocked = blocked;
      block();
      if (wasBlocked) {
        return;
      }
    }
    addActionAfterClosingSheet(() => oldNavigate(...args));
  } else {
    oldNavigate(...args);
  }
}

export function getActiveRoute() {
  return TopLevelNavigationRef?.getCurrentRoute();
}

function getActiveOptions() {
  return TopLevelNavigationRef?.getCurrentOptions();
}

/**
 * Gets the current screen from navigation state
 */
function getActiveRouteName(navigationState: any) {
  // @ts-expect-error ts-migrate(2554) FIXME: Expected 0 arguments, but got 1.
  const route = getActiveRoute(navigationState);
  return get(route, 'name');
}

/**
 * Handle a navigation action or queue the action if navigation actions have been paused.
 * @param  {Object} action      The navigation action to run.
 */
function handleAction(name: any, params: any, replace = false) {
  if (!TopLevelNavigationRef) return;
  const action = (replace ? StackActions.replace : CommonActions.navigate)(
    name,
    params
  );
  TopLevelNavigationRef?.dispatch(action);
}

/**
 * Set Top Level Navigator
 */
function setTopLevelNavigator(navigatorRef: any) {
  TopLevelNavigationRef = navigatorRef;
}

export default {
  getActiveOptions,
  getActiveRoute,
  getActiveRouteName,
  handleAction,
  setTopLevelNavigator,
  transitionPosition,
};
