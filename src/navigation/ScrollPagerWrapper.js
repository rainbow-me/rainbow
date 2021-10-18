import React, { forwardRef } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import ScrollPager from '../helpers/ScrollPager';
import { ScrollPositionContext } from './ScrollPositionContext';
import ViewPagerAdapter from './ViewPagerAdapter';

export default forwardRef(function ScrollPagerWrapper(props, ref) {
  const position = useSharedValue(props.initialScrollPosition ?? 0);
  return (
    <ScrollPositionContext.Provider value={position}>
      {android ? (
        <ViewPagerAdapter
          {...props}
          keyboardDismissMode="none"
          overScrollMode="never"
        />
      ) : (
        <ScrollPager
          {...props}
          overscroll={false}
          position={position}
          ref={ref}
        />
      )}
    </ScrollPositionContext.Provider>
  );
});
