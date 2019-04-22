/* eslint-disable react/display-name */
import { PanGestureHandler } from 'react-native-gesture-handler';
import React from 'react';
import { Animated } from 'react-native';

export default (InnerComponent) => (props) => (
  <PanGestureHandler
    minDeltaX={1000}
    minDeltaY={5}
  >
    <Animated.View>
      <InnerComponent {...props} />
    </Animated.View>
  </PanGestureHandler>
);
