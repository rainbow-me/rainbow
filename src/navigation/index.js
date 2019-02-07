import { Animated, InteractionManager } from 'react-native';
import { StackActions } from 'react-navigation';

const queuedNavigationActions = [];
let isPaused = false;
let transitionPosition = new Animated.Value(0);

let _navigator = null;

/**
 * Set Top Level Navigator
 */
function setTopLevelNavigator(navigatorRef) {
  _navigator = navigatorRef;
}

/**
 * Gets the current screen from navigation state
 */
function getActiveRouteName(navigationState) {
  if (!navigationState) return null;

  const route = navigationState.routes[navigationState.index];
  // recursively dive into nested navigators
  if (route.routes) {
    return getActiveRouteName(route);
  }
  return route.routeName;
}

/**
 * Handle a navigation action or queue the action if navigation actions have been paused.
 * @param  {Object} action      The navigation action to run.
 */
function handleAction(action) {
  if (!_navigator) return;

  action = StackActions.push(action);

  if (isPaused) {
    queuedNavigationActions.push(action);
  } else {
    _navigator.dispatch(action);
  }
}

/**
 * Pause all navigation actions.
 */
function pauseNavigationActions() {
  isPaused = true;
}

/**
 * Resume all navigation actions and handle any that have been queued.
 * @param  {Object} navigation  The navigation object defined by react-navigation.
 */
function resumeNavigationActions(navigation) {
  isPaused = false;

  // XXX - Need to determine if we want to navigate to next page instantly or after certain timeout.
  if (queuedNavigationActions.length) {
    InteractionManager.runAfterInteractions(() => {
      while (queuedNavigationActions.length) {
        const currentAction = queuedNavigationActions.pop();

        navigation.dispatch(currentAction);
      }
    });
  }
}

function getTransitionPosition() {
  return transitionPosition;
}

function setTransitionPosition(position) {
  transitionPosition = position;
}

export default {
  setTopLevelNavigator,
  getActiveRouteName,
  getTransitionPosition,
  handleAction,
  pauseNavigationActions,
  resumeNavigationActions,
  setTransitionPosition,
};
