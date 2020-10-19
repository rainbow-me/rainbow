import React, { forwardRef } from 'react';
import { Platform } from 'react-native';
import { Value } from 'react-native-reanimated';
import ViewPagerAdapter from 'react-native-tab-view-viewpager-adapter';
import ScrollPager from '../helpers/ScrollPager';

export const scrollPosition = new Value(1);

export default forwardRef(function ScrollPagerWrapper(props, ref) {
  return Platform.select({
    android: (
      <ViewPagerAdapter
        {...props}
        keyboardDismissMode="none"
        overScrollMode="never"
      />
    ),
    ios: <ScrollPager {...props} overscroll={false} ref={ref} />,
  });
});
