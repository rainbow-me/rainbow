import React from 'react';
import { setString } from '../../hooks/useClipboard';
import { ButtonPressAnimation } from '../animations';
import FloatingEmojis from './FloatingEmojis';
import { magicMemo } from '@rainbow-me/utils';

const CopyFloatingEmojis = ({
  children,
  disabled,
  onPress,
  textToCopy,
  ...props
}) => {
  return (
    <FloatingEmojis
      distance={250}
      duration={500}
      fadeOut={false}
      scaleTo={0}
      size={50}
      wiggleFactor={0}
      {...props}
    >
      {({ onNewEmoji }) => (
        <ButtonPressAnimation
          hapticType="impactLight"
          onPress={() => {
            onPress?.(textToCopy);
            if (!disabled) {
              onNewEmoji();
              setString(textToCopy);
            }
          }}
        >
          {children}
        </ButtonPressAnimation>
      )}
    </FloatingEmojis>
  );
};

export default magicMemo(CopyFloatingEmojis, [
  'disabled',
  'onPress',
  'textToCopy',
]);
