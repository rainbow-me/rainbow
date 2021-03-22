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
import { NATIVE_ROUTES } from '@rainbow-me/routes';

let TopLevelNavigationRef = null;
const transitionPosition = new Value(0);

const poppingCounter = { isClosing: false, pendingActions: [] };

export function addActionAfterClosingSheet(action) {
  if (poppingCounter.isClosing) {
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

export function withNavigation(Component) {
  return function WithNavigationWrapper(props) {
    const navigation = useNavigation();
    return <Component {...props} navigation={navigation} />;
  };
}

export function withNavigationFocus(Component) {
  return function WithNavigationWrapper(props) {
    const isFocused = useIsFocused();

    return <Component {...props} isFocused={isFocused} />;
  };
}

let blocked = false;
let timeout = null;
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
export function navigate(oldNavigate, ...args) {
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
function getActiveRouteName(navigationState) {
  const route = getActiveRoute(navigationState);
  return get(route, 'name');
}

/**
 * Handle a navigation action or queue the action if navigation actions have been paused.
 * @param  {Object} action      The navigation action to run.
 */
function handleAction(name, params, replace = false) {
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
function setTopLevelNavigator(navigatorRef) {
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
