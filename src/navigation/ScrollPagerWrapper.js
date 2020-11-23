import React, { forwardRef } from 'react';
import { Platform } from 'react-native';
import { Value } from 'react-native-reanimated';
import Pager from 'react-native-tab-view/lib/module/Pager';
import ScrollPager from '../helpers/ScrollPager';

export const scrollPosition = new Value(1);

export default forwardRef(function ScrollPagerWrapper(props, ref) {
  return Platform.select({
    android: <Pager {...props} />,
    ios: <ScrollPager {...props} overscroll={false} ref={ref} />,
  });
});
