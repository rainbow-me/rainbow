/* eslint-disable react/display-name */
import { PanGestureHandler } from 'react-native-gesture-handler';
import React from 'react';
import { Animated } from 'react-native';

export default (InnerComponent) => (props) => (
  <PanGestureHandler
    minDeltaX={5}
    minDeltaY={1000}
  >
    <Animated.View>
      <InnerComponent {...props} />
    </Animated.View>
  </PanGestureHandler>
);
