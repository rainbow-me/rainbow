import { Platform } from 'react-native';
import { createStackNavigator as oldCreateStackNavigator } from 'react-navigation-stack';
import Routes from './routesNames';

export function createStackNavigator(routes, config = {}) {
  return oldCreateStackNavigator(routes, {
    headerMode: 'none',
    initialRouteName: Routes.SWIPE_LAYOUT,
    keyboardHandlingEnabled: Platform.OS === 'ios',
    mode: 'modal',
    ...config,
    // eslint-disable-next-line sort-keys
    defaultNavigationOptions: {
      gestureEnabled: true,
      ...config.defaultNavigationOptions,
    },
  });
}
