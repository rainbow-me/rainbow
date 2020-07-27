import React, { useRef } from 'react';
import { Platform } from 'react-native';
import { Value } from 'react-native-reanimated';
import ViewPagerAdapter from 'react-native-tab-view-viewpager-adapter';
import ScrollPager from '../helpers/ScrollPager';
import { delayNext } from '../hooks/useMagicAutofocus';

export const scrollPosition = new Value(1);

export function ScrollPagerWrapper(props) {
  const ref = useRef();
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
          if (props.setSwipeEnabled) {
            setTimeout(
              () =>
                ref.current.scrollViewRef.current.setNativeProps({
                  pointerEvents: 'auto',
                }),
              40
            );
          }
          props.onSwipeEnd();
        }}
        onSwipeStart={() => {
          if (props.setSwipeEnabled) {
            ref.current.scrollViewRef.current.setNativeProps({
              pointerEvents: 'none',
            });
          }

          delayNext();
          props.onSwipeStart();
        }}
        overscroll={false}
        ref={ref}
      />
    ),
  });
}
