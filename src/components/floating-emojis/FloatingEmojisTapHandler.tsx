import React, { useCallback } from 'react';
import { Animated } from 'react-native';
import { State, TapGestureHandler } from 'react-native-gesture-handler';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { position } from '@rainbow-me/styles';

export default function FloatingEmojisTapHandler({
  children,
  disabled = false,
  onNewEmoji,
  onPress,
  ...props
}: any) {
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <TapGestureHandler
      {...props}
      {...position.sizeAsObject('100%')}
      enabled={!disabled}
      onHandlerStateChange={handleTap}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Animated.View accessible>{children}</Animated.View>
    </TapGestureHandler>
  );
}
