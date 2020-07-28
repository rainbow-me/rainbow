import React, { forwardRef } from 'react';
import { Platform } from 'react-native';
import { Value } from 'react-native-reanimated';
import ViewPagerAdapter from 'react-native-tab-view-viewpager-adapter';
import ScrollPager from '../helpers/ScrollPager';

export const scrollPosition = new Value(1);

const ScrollPagerWrapperRef = forwardRef(function ScrollPagerWrapper(
  props,
  ref
) {
  return Platform.select({
    android: <ViewPagerAdapter {...props} overScrollMode="never" />,
    ios: <ScrollPager {...props} overscroll={false} ref={ref} />,
  });
});

export { ScrollPagerWrapperRef as ScrollPagerWrapper };
