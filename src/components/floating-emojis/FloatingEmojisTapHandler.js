import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { Animated } from 'react-native';
import { State, TapGestureHandler } from 'react-native-gesture-handler';
import { position } from '../../styles';

const FloatingEmojisTapHandler = ({ children, onNewEmoji, ...props }) => {
  const handleTap = useCallback(
    ({ nativeEvent: { state, x, y } }) => {
      if (state === State.ACTIVE) {
        onNewEmoji(x, y);
      }
    },
    [onNewEmoji]
  );

  return (
    <TapGestureHandler
      {...props}
      {...position.sizeAsObject('100%')}
      onHandlerStateChange={handleTap}
    >
      <Animated.View>{children}</Animated.View>
    </TapGestureHandler>
  );
};

FloatingEmojisTapHandler.propTypes = {
  children: PropTypes.node,
  onNewEmoji: PropTypes.func.isRequired,
};

export default FloatingEmojisTapHandler;
