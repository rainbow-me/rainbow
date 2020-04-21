import PropTypes from 'prop-types';
import React from 'react';
import {
  PanGestureHandler,
  TapGestureHandler,
} from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

const TimestampText = ({
  children,
  enabled,
  onTapGestureEvent,
  onPanGestureEvent,
  onHandlerStateChange,
}) =>
  enabled ? (
    <TapGestureHandler onHandlerStateChange={onTapGestureEvent} maxDeltaY={30}>
      <Animated.View>
        <PanGestureHandler
          minDist={1}
          shouldActivateOnStart
          onGestureEvent={onPanGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
          failOffsetY={2}
        >
          {children}
        </PanGestureHandler>
      </Animated.View>
    </TapGestureHandler>
  ) : (
    children
  );

TimestampText.propTypes = {
  children: PropTypes.string,
};

export default TimestampText;
