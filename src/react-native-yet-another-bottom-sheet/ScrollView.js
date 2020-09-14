import React, { useContext, useEffect } from 'react';
import { ScrollView as GHScrollView } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import Context from './Context';

const AnimatedScrollView = Animated.createAnimatedComponent(GHScrollView);

let id = 0;

export const svid = 'AnimatedScrollViewYABS' + id;

export default function ScrollView(props) {
  const { scrollHandler, animatedRef, onLayout } = useContext(Context);

  useEffect(() => () => ++id, []);

  return (
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
