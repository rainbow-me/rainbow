import React from 'react';
import { Platform } from 'react-native';
import { Value } from 'react-native-reanimated';
import { ScrollPager } from 'react-native-tab-view';
import ViewPagerAdapter from 'react-native-tab-view-viewpager-adapter';

export const scrollPosition = new Value(1);

export function ScrollPagerWrapper(props) {
  return Platform.select({
    android: <ViewPagerAdapter {...props} overScrollMode="never" />,
    ios: <ScrollPager {...props} overscroll={false} />,
  });
}
