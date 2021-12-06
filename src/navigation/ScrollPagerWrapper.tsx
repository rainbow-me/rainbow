import React, { forwardRef } from 'react';
import { useSharedValue } from 'react-native-reanimated';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../helpers/ScrollPager' was resolved to '/... Remove this comment to see the full error message
import ScrollPager from '../helpers/ScrollPager';
import { ScrollPositionContext } from './ScrollPositionContext';
// @ts-expect-error ts-migrate(6142) FIXME: Module './ViewPagerAdapter' was resolved to '/User... Remove this comment to see the full error message
import ViewPagerAdapter from './ViewPagerAdapter';

export default forwardRef(function ScrollPagerWrapper(props, ref) {
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'initialScrollPosition' does not exist on... Remove this comment to see the full error message
  const position = useSharedValue(props.initialScrollPosition ?? 0);
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ScrollPositionContext.Provider value={position}>
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
      {android ? (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <ViewPagerAdapter
          {...props}
          keyboardDismissMode="none"
          overScrollMode="never"
        />
      ) : (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
