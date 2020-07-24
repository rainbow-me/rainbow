import React from 'react';
import { Platform } from 'react-native';
import { Value } from 'react-native-reanimated';
import { ScrollPager } from 'react-native-tab-view';
import ViewPagerAdapter from 'react-native-tab-view-viewpager-adapter';
import { delayNext } from '../hooks/useMagicAutofocus';

export const scrollPosition = new Value(1);

export function ScrollPagerWrapper(props) {
  return Platform.select({
    android: <ViewPagerAdapter {...props} overScrollMode="never" />,
    ios: (
      <ScrollPager
        {...props}
        onSwipeStart={() => {
          delayNext();
          props.onSwipeStart();
        }}
        overscroll={false}
      />
    ),
  });
}
