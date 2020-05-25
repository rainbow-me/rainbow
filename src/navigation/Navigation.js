import { useCallback } from 'react';
import { Value } from 'react-native-reanimated';
import { StackActions } from 'react-navigation';
import { useNavigation as oldUseNavigation } from 'react-navigation-hooks';

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

  const handleNavigate = useCallback(
    (...args) => navigate(oldNavigate, ...args),
    [oldNavigate]
  );

  return {
    navigate: handleNavigate,
    ...rest,
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

function getActiveRoute(navigationState) {
  navigationState = navigationState || TopLevelNavigationRef?.state?.nav;
  if (!navigationState) return null;

  const route = navigationState.routes[navigationState.index];
  // recursively dive into nested navigators
  if (route.routes) {
    return getActiveRoute(route);
  }
  return route;
}

/**
 * Gets the current screen from navigation state
 */
function getActiveRouteName(navigationState) {
  const route = getActiveRoute(navigationState);
  return route?.routeName;
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
  getActiveRoute,
  getActiveRouteName,
  handleAction,
  setTopLevelNavigator,
  transitionPosition,
};
