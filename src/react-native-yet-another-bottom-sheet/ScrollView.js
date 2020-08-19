import React, { useCallback, useContext } from 'react';
import { ScrollView as GHScrollView } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import Context from './Context';

const AnimatedScrollView = Animated.createAnimatedComponent(GHScrollView);

export default function ScrollView(props) {
  const { scrollHandler, animatedRef, layout } = useContext(Context);
  const onLayout = useCallback(
    ({ nativeEvent: { layout: newLayout } }) => (layout.value = newLayout),
    [layout]
  );

  return (
    <AnimatedScrollView
      bounces={false}
      decelerationRate="fast"
      id="AnimatedScrollViewYABS"
      onLayout={onLayout}
      onScroll={scrollHandler}
      ref={animatedRef}
      scrollEventThrottle={16}
      {...props}
    />
  );
}
