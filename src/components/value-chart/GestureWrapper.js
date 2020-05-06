import React from 'react';
import {
  PanGestureHandler,
  TapGestureHandler,
} from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

export default function GestureWrapper({
  children,
  enabled,
  onHandlerStateChange,
  onPanGestureEvent,
  onTapGestureEvent,
}) {
  return enabled ? (
    <TapGestureHandler maxDeltaY={30} onHandlerStateChange={onTapGestureEvent}>
      <Animated.View accessible justifyContent="flex-start">
        <PanGestureHandler
          failOffsetY={2}
          minDist={1}
          onGestureEvent={onPanGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
          shouldActivateOnStart
        >
          <Animated.View>{children}</Animated.View>
        </PanGestureHandler>
      </Animated.View>
    </TapGestureHandler>
  ) : (
    children
  );
}
