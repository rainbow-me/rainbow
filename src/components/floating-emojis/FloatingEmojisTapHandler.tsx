import React, { useCallback } from 'react';
import { Animated } from 'react-native';
import { State, TapGestureHandler } from 'react-native-gesture-handler';
import { position } from '@rainbow-me/styles';

export default function FloatingEmojisTapHandler({
  children,
  disabled = false,
  onNewEmoji,
  onPress,
  ...props
}) {
  const handleTap = useCallback(
    ({ nativeEvent: { state, x, y } }) => {
      if (state === State.ACTIVE) {
        onNewEmoji?.(x, y);
        onPress?.();
      }
    },
    [onNewEmoji, onPress]
  );

  return (
    <TapGestureHandler
      {...props}
      {...position.sizeAsObject('100%')}
      enabled={!disabled}
      onHandlerStateChange={handleTap}
    >
      <Animated.View accessible>{children}</Animated.View>
    </TapGestureHandler>
  );
}
