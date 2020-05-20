import React from 'react';
import { Animated } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';

// Adding extra PanGestureHandler allows for capturing gesture
// before it got delivered to navigator
export default function HorizontalGestureBlocker(props) {
  return (
    <PanGestureHandler minDeltaX={20} minDeltaY={1000}>
      <Animated.View accessible {...props} />
    </PanGestureHandler>
  );
}
