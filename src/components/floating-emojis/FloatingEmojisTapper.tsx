import React from 'react';
import { ButtonPressAnimation } from '../animations';
// @ts-expect-error ts-migrate(6142) FIXME: Module './FloatingEmojis' was resolved to '/Users/... Remove this comment to see the full error message
import FloatingEmojis from './FloatingEmojis';
// @ts-expect-error ts-migrate(6142) FIXME: Module './FloatingEmojisTapHandler' was resolved t... Remove this comment to see the full error message
import FloatingEmojisTapHandler from './FloatingEmojisTapHandler';

export default function FloatingEmojisTapper({
  activeScale = 1.01,
  children,
  disabled,
  onPress,
  radiusAndroid,
  ...props
}: any) {
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <FloatingEmojis
      distance={350}
      duration={2000}
      size={36}
      wiggleFactor={1}
      {...props}
    >
      {({ onNewEmoji }: any) => (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <FloatingEmojisTapHandler
          disabled={disabled}
          onNewEmoji={onNewEmoji}
          onPress={onPress}
        >
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <ButtonPressAnimation
            disabled={disabled}
            radiusAndroid={radiusAndroid}
            scaleTo={activeScale}
          >
            {children}
          </ButtonPressAnimation>
        </FloatingEmojisTapHandler>
      )}
    </FloatingEmojis>
  );
}
