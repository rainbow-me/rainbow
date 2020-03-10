import React from 'react';
import {
  PanGestureHandler,
  TapGestureHandler,
} from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

export default function GestureWrapper({
  children,
  enabled,
  onTapGestureEvent,
  onPanGestureEvent,
  onHandlerStateChange,
}) {
  return enabled ? (
    <TapGestureHandler maxDeltaY={30} onHandlerStateChange={onTapGestureEvent}>
      <Animated.View>
        <PanGestureHandler
          failOffsetY={2}
          minDist={1}
          onGestureEvent={onPanGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
          shouldActivateOnStart
        >
          {children}
        </PanGestureHandler>
      </Animated.View>
    </TapGestureHandler>
  ) : (
    children
  );
}
