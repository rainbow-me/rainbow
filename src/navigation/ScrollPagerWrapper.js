import React, { forwardRef } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import ScrollPager from '@rainbow-me/utils/ScrollPager';
import { ScrollPositionContext } from './ScrollPositionContext';
import ViewPagerAdapter from './ViewPagerAdapter';

export default forwardRef(function ScrollPagerWrapper(
  { initialScrollPosition, useViewPagerAdaptor = android, ...rest },
  ref
) {
  const position = useSharedValue(initialScrollPosition ?? 0);
  return (
    <ScrollPositionContext.Provider value={position}>
      {useViewPagerAdaptor ? (
        <ViewPagerAdapter
          {...rest}
          initialScrollPosition={initialScrollPosition}
          keyboardDismissMode="none"
          overScrollMode="never"
        />
      ) : (
        <ScrollPager
          {...rest}
          overscroll={false}
          position={position}
          ref={ref}
        />
      )}
    </ScrollPositionContext.Provider>
  );
});
