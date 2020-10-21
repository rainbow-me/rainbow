import React from 'react';
import { ButtonPressAnimation } from '../animations';
import FloatingEmojis from './FloatingEmojis';
import FloatingEmojisTapHandler from './FloatingEmojisTapHandler';

export default function FloatingEmojisTapper({
  activeScale = 1.01,
  children,
  radiusAndroid,
  ...props
}) {
  return (
    <FloatingEmojis
      distance={350}
      duration={2000}
      size={36}
      wiggleFactor={1}
      {...props}
    >
      {({ onNewEmoji }) => (
        <FloatingEmojisTapHandler onNewEmoji={onNewEmoji}>
          <ButtonPressAnimation
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
