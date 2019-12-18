import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { State, TapGestureHandler } from 'react-native-gesture-handler';
import { position } from '../../styles';

const FloatingEmojisTapHandler = ({ onNewEmoji, ...props }) => {
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
    />
  );
};

FloatingEmojisTapHandler.propTypes = {
  onNewEmoji: PropTypes.func.isRequired,
};

export default React.memo(FloatingEmojisTapHandler);
