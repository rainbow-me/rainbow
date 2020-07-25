import React from 'react';
import { Platform } from 'react-native';
import { Value } from 'react-native-reanimated';
import ViewPagerAdapter from 'react-native-tab-view-viewpager-adapter';
import ScrollPager from '../helpers/ScrollPager';
import { delayNext } from '../hooks/useMagicAutofocus';

export const scrollPosition = new Value(1);

export function ScrollPagerWrapper(props) {
  return Platform.select({
    android: <ViewPagerAdapter {...props} overScrollMode="never" />,
    ios: (
      <ScrollPager
        {...props}
        onSwipeEnd={velocity => {
          if (velocity < 0) {
            // we're disabling swiping immediately after detecting returning animation
            props.setSwipeEnabled?.(false);
          }
          props.onSwipeEnd();
        }}
        onSwipeStart={() => {
          delayNext();
          props.onSwipeStart();
        }}
        overscroll={false}
      />
    ),
  });
}
