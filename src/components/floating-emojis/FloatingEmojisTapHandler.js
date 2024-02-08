import React, { useCallback } from 'react';
import { Animated } from 'react-native';
import { State, TapGestureHandler } from 'react-native-gesture-handler';
import { position } from '@/styles';

export default function FloatingEmojisTapHandler({ children, disabled = false, onNewEmoji, onPress, yOffset, ...props }) {
  const handleTap = useCallback(
    ({ nativeEvent: { state, x, y } }) => {
      if (state === State.ACTIVE) {
        onNewEmoji?.(x, y + (yOffset || 0));
        onPress?.();
      }
    },
    [onNewEmoji, onPress, yOffset]
  );

  return (
    <TapGestureHandler {...props} {...position.sizeAsObject('100%')} enabled={!disabled} onHandlerStateChange={handleTap}>
      <Animated.View accessible>{children}</Animated.View>
    </TapGestureHandler>
  );
}
