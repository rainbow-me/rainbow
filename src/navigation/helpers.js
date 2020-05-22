import React, { useRef } from 'react';
import { Platform } from 'react-native';
import { Value } from 'react-native-reanimated';
import { ScrollPager } from 'react-native-tab-view';
import ViewPagerAdapter from 'react-native-tab-view-viewpager-adapter';
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

export function ScrollPagerWrapper(props) {
  return Platform.select({
    android: <ViewPagerAdapter {...props} />,
    ios: <ScrollPager {...props} overscroll={false} />,
  });
}

export const useReanimatedValue = initialValue => {
  const value = useRef();

  if (!value.current) {
    value.current = new Value(initialValue);
  }

  return value.current;
};
