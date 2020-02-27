import { createStackNavigator } from 'react-navigation-stack';
import store from '../redux/store';
import { updateTransitionProps } from '../redux/navigation';

export const onTransitionEnd = () =>
  store.dispatch(updateTransitionProps({ isTransitioning: false }));
export const onTransitionStart = () =>
  store.dispatch(updateTransitionProps({ isTransitioning: true }));

export default function(routes, config = {}) {
  return createStackNavigator(routes, {
    headerMode: 'none',
    initialRouteName: 'SwipeLayout',
    keyboardHandlingEnabled: false,
    mode: 'modal',
    ...config,
    // eslint-disable-next-line sort-keys
    defaultNavigationOptions: {
      gestureEnabled: true,
      onTransitionEnd,
      onTransitionStart,
      ...config.defaultNavigationOptions,
    },
  });
}
