import { useNavigation as oldUseNavigation } from '@react-navigation/native';
import { get } from 'lodash';
import React from 'react';
import { Value } from 'react-native-reanimated';
import { StackActions } from 'react-navigation';

let TopLevelNavigationRef = null;
const transitionPosition = new Value(0);

const poppingCounter = { isClosing: false, pendingAction: null };

export function onWillPop() {
  poppingCounter.isClosing = true;
}

export function onDidPop() {
  poppingCounter.isClosing = false;
  if (poppingCounter.pendingAction) {
    setImmediate(() => {
      poppingCounter.pendingAction();
      poppingCounter.pendingAction = null;
    });
  }
}

export function useNavigation() {
  const { navigate: oldNavigate, ...rest } = oldUseNavigation();
  return {
    navigate: (...args) => navigate(oldNavigate, ...args),
    ...rest,
  };
}

export function withNavigation(Component) {
  return function WithNavigationWrapper(props) {
    const navigation = useNavigation();
    return <Component {...props} navigation={navigation} />;
  };
}

/**
 * With this wrapper we allow to delay pushing of native
 * screen with delay when there's a closing transaction in progress
 */
export function navigate(oldNavigate, ...args) {
  if (typeof args[0] === 'string' && poppingCounter.isClosing) {
    poppingCounter.pendingAction = () => oldNavigate(...args);
  } else {
    oldNavigate(...args);
  }
}

function getActiveRoute() {
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
function handleAction(action) {
  if (!TopLevelNavigationRef) return;

  action = StackActions.push(action);
  TopLevelNavigationRef.dispatch(action);
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
