const queuedNavigationActions = [];
let isPaused = false;

/**
 * Handle a navigation action or queue the action if navigation actions have been paused.
 * @param  {Object} navigation  The navigation object defined by react-navigation.
 * @param  {Object} action      The navigation action to run.
 */
function handleAction(navigation, action) {
  if (isPaused) {
    queuedNavigationActions.push(action);
  } else {
    navigation.dispatch(action);
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
  setTimeout(() => {
    while (queuedNavigationActions.length) {
      const currentAction = queuedNavigationActions.pop();

      navigation.dispatch(currentAction);
    }
  }, 300);
}

export default {
  handleAction,
  pauseNavigationActions,
  resumeNavigationActions,
};
