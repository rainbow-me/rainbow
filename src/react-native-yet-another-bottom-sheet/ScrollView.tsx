import React, { useContext, useEffect } from 'react';
import { ScrollView as GHScrollView } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import Context from './Context';

const AnimatedScrollView = Animated.createAnimatedComponent(GHScrollView);

let id = 0;

export const svid = 'AnimatedScrollViewYABS' + id;

export default function ScrollView(props: any) {
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'scrollHandler' does not exist on type 'n... Remove this comment to see the full error message
  const { scrollHandler, animatedRef, onLayout } = useContext(Context);

  // @ts-expect-error ts-migrate(2322) FIXME: Type '() => number' is not assignable to type 'voi... Remove this comment to see the full error message
  useEffect(() => () => ++id, []);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <AnimatedScrollView
      bounces={false}
      decelerationRate="fast"
      id={svid}
      onLayout={onLayout}
      onScroll={scrollHandler}
      ref={animatedRef}
      scrollEventThrottle={16}
      {...props}
    />
  );
}
