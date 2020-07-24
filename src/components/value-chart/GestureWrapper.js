import React, { useRef } from 'react';
import {
  PanGestureHandler,
  TapGestureHandler,
} from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

export default function GestureWrapper({
  children,
  enabled,
  panGestureHandler,
  tapGestureHandler,
}) {
  const panHandlerRef = useRef();
  const tapHandlerRef = useRef();

  return enabled ? (
    <TapGestureHandler
      {...tapGestureHandler}
      maxDeltaY={30}
      simultaneousHandlers={panHandlerRef}
    >
      <Animated.View accessible justifyContent="flex-start">
        <PanGestureHandler
          {...panGestureHandler}
          failOffsetY={2}
          minDist={1}
          shouldActivateOnStart
          simultaneousHandlers={tapHandlerRef}
        >
          <Animated.View>{children}</Animated.View>
        </PanGestureHandler>
      </Animated.View>
    </TapGestureHandler>
  ) : (
    children
  );
}
