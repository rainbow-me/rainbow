import { get } from 'lodash';
import Animated from 'react-native-reanimated';
import { StackActions } from 'react-navigation';

let TopLevelNavigationRef = null;
const transitionPosition = new Animated.Value(0);

function getActiveRoute(navigationState) {
  navigationState = navigationState || get(TopLevelNavigationRef, 'state.nav');
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
  return get(route, 'routeName');
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
